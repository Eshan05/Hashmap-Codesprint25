import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Ratelimit } from '@upstash/ratelimit';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { retryWithExponentialBackoff } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { upstashRedis } from '@/lib/redis';
import DiseaseSearch from '@/models/disease-search';
import UserProfile from '@/models/user-profile';
import type { LLMDiseasePayload } from '@/types/disease-search';
import dbConnect from '@/utils/db-conn';

const ratelimit = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GEMINI_API || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  generationConfig: { responseMimeType: 'application/json' },
});

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildQueryHash(userId: string, query: string): string {
  return createHash('sha256').update(`${userId}:${normalizeQuery(query)}`).digest('hex');
}

async function buildProfileSummary(userId: string): Promise<string> {
  try {
    const profile = await UserProfile.findOne({ user: userId }).lean();
    if (!profile) {
      return '';
    }

    const medical = profile.medicalProfile || {};
    const dob = medical.dob ? new Date(medical.dob) : null;
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null;
    const chronic = Array.isArray(medical.chronicConditions)
      ? medical.chronicConditions.map((c: any) => c?.name ?? String(c)).join(', ')
      : '';
    const familyHistory = Array.isArray(medical.familyHistory)
      ? medical.familyHistory.map((f: any) => f?.condition ?? String(f)).join(', ')
      : '';
    const allergies = Array.isArray(medical.allergies)
      ? medical.allergies.map((a: any) => a?.name ?? String(a)).join(', ')
      : '';
    const medications = Array.isArray(medical.medications)
      ? medical.medications.map((m: any) => m?.name ?? m?.brand_name ?? String(m)).join(', ')
      : '';

    return `Patient context:\n- age: ${age ?? 'unknown'}\n- sex: ${medical.sex ?? 'unknown'}\n- bloodType: ${medical.bloodType ?? 'unknown'}\n- chronicConditions: ${chronic || 'none'}\n- familyHistory: ${familyHistory || 'none'}\n- allergies: ${allergies || 'none'}\n- medications: ${medications || 'none'}`;
  } catch (error) {
    console.warn('Failed to build profile summary for disease search', error);
    return '';
  }
}

function payloadSchema() {
  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      diseaseName: { type: SchemaType.STRING },
      diseaseSummary: { type: SchemaType.STRING },
      laymanTermsSummary: { type: SchemaType.STRING },
      commonSymptoms: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      transmission: { type: SchemaType.STRING },
      severity: { type: SchemaType.STRING },
      progression: { type: SchemaType.STRING },
      associatedConditions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      diagnosticProcess: { type: SchemaType.STRING },
      treatmentSummary: { type: SchemaType.STRING },
      medications: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      therapiesAndProcedures: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      lifestyleChanges: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      riskFactors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      preventionStrategies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      diseaseMechanism: { type: SchemaType.STRING },
      etiology: { type: SchemaType.STRING },
      disclaimer: { type: SchemaType.STRING },
    },
    required: [
      'diseaseName',
      'diseaseSummary',
      'laymanTermsSummary',
      'commonSymptoms',
      'transmission',
      'severity',
      'progression',
      'associatedConditions',
      'diagnosticProcess',
      'treatmentSummary',
      'medications',
      'therapiesAndProcedures',
      'lifestyleChanges',
      'riskFactors',
      'preventionStrategies',
      'diseaseMechanism',
      'etiology',
      'disclaimer',
    ],
  } as const;

  return schema;
}

function buildPrompt(diseaseName: string, profileSummary: string) {
  const profileClause = profileSummary ? `\n\n${profileSummary}` : '';
  return `You are a collaborative medical knowledge assistant. Provide an approachable yet clinically reliable briefing about the condition "${diseaseName}".\n- Use compassionate, stigma-free language.\n- Ensure laymanTermsSummary is a two-to-three sentence primer suited for patients.\n- diseaseSummary should expand slightly while staying accessible.\n- transmission must name how it spreads or whether it is inherited or non-contagious.\n- severity should describe typical outcomes (e.g., "Often chronic but manageable" or "Life-threatening without treatment").\n- progression should outline stages or usual course over time.\n- associatedConditions should list related illnesses or complications.\n- diagnosticProcess must outline the common evaluation (tests, imaging, clinical criteria).\n- treatmentSummary needs a narrative overview (include medical and supportive care).\n- medications, therapiesAndProcedures, lifestyleChanges, and preventionStrategies should list practical steps (limit to 6 bullet items each).\n- diseaseMechanism and etiology may use clinical language suitable for professionals.\n- disclaimer should gently remind users to consult healthcare professionals.\n${profileClause}\n\nReturn ONLY one JSON object that matches the provided schema with keys: title, summary, payload.`;
}

async function generateDiseaseResponse(options: {
  searchId: string;
  diseaseName: string;
  profileSummary: string;
}) {
  const { searchId, diseaseName, profileSummary } = options;
  const started = Date.now();

  try {
    const prompt = buildPrompt(diseaseName, profileSummary);
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        payload: payloadSchema(),
      },
      required: ['title', 'summary', 'payload'],
    } as const;

    const result = await retryWithExponentialBackoff(() =>
      // @ts-expect-error Upstream types do not accept literal response schema
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      })
    );

    const parsed = JSON.parse(result.response.text()) as {
      title: string;
      summary: string;
      payload: LLMDiseasePayload;
    };

    await DiseaseSearch.findOneAndUpdate(
      { searchId },
      {
        title: parsed.title,
        summary: parsed.summary,
        payload: JSON.stringify(parsed.payload),
        status: 'ready',
        errorMessage: '',
        duration: Date.now() - started,
      }
    );
  } catch (error) {
    console.error('Error generating disease response', error);
    const message = error instanceof Error ? error.message : 'Failed to generate disease response';
    await DiseaseSearch.findOneAndUpdate(
      { searchId },
      {
        status: 'errored',
        errorMessage: message,
      }
    );
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { success } = await ratelimit.limit(`${session.user.id}:diseases:get`);
    if (!success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const searchId = searchParams.get('searchId');
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);

    if (searchId) {
      const search = await DiseaseSearch.findOne({ searchId, user: session.user.id }).lean();
      if (!search) {
        return NextResponse.json({ message: 'Search not found' }, { status: 404 });
      }
      return NextResponse.json(search, { status: 200 });
    }

    const skip = Math.max(0, (page - 1) * limit);
    const [searches, total] = await Promise.all([
      DiseaseSearch.find({ user: session.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DiseaseSearch.countDocuments({ user: session.user.id }),
    ]);

    return NextResponse.json(
      {
        data: searches,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in disease search GET', error);
    return NextResponse.json({ message: 'An error occurred', error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { success } = await ratelimit.limit(`${session.user.id}:diseases:post`);
    if (!success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const diseaseName: string = body?.diseaseName;

    if (!diseaseName || typeof diseaseName !== 'string') {
      return NextResponse.json({ message: 'diseaseName is required' }, { status: 400 });
    }

    const trimmed = diseaseName.trim();
    if (trimmed.length < 3 || trimmed.length > 120) {
      return NextResponse.json({ message: 'diseaseName must be between 3 and 120 characters' }, { status: 400 });
    }

    const validCharacters = /^[a-z0-9 ,.'()/-]+$/i;
    if (!validCharacters.test(trimmed)) {
      return NextResponse.json({ message: 'diseaseName contains unsupported characters' }, { status: 400 });
    }

    const queryHash = buildQueryHash(session.user.id, trimmed);
    const existing = await DiseaseSearch.findOne({ user: session.user.id, queryHash }).lean();
    if (existing) {
      return NextResponse.json(
        {
          searchId: existing.searchId,
          query: existing.query,
          status: existing.status,
          reused: true,
        },
        { status: 200 }
      );
    }

    const searchId = uuidv4();
    await DiseaseSearch.create({
      searchId,
      user: session.user.id,
      query: trimmed,
      queryHash,
      status: 'pending',
    });

    const profileSummary = await buildProfileSummary(session.user.id);
    await generateDiseaseResponse({
      searchId,
      diseaseName: trimmed,
      profileSummary,
    });

    const refreshed = await DiseaseSearch.findOne({ searchId }).lean();
    return NextResponse.json(
      {
        searchId,
        query: trimmed,
        status: refreshed?.status ?? 'pending',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in disease search POST', error);
    return NextResponse.json({ message: 'An error occurred', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { success } = await ratelimit.limit(`${session.user.id}:diseases:delete`);
    if (!success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const searchId = searchParams.get('searchId');
    if (!searchId) {
      return NextResponse.json({ message: 'searchId is required' }, { status: 400 });
    }

    const deleted = await DiseaseSearch.findOneAndDelete({ searchId, user: session.user.id });
    if (!deleted) {
      return NextResponse.json({ message: 'Search not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Search deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in disease search DELETE', error);
    return NextResponse.json({ message: 'An error occurred', error: String(error) }, { status: 500 });
  }
}
