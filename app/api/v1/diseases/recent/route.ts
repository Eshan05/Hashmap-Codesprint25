import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import DiseaseSearch from '@/models/disease-search';
import dbConnect from '@/utils/db-conn';

// GET /api/v1/diseases/recent?userId=xxx&page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const explicitUserId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let userId = explicitUserId || '';
    if (!userId) {
      try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (session?.user?.id) {
          userId = session.user.id;
        }
      } catch (error) {
        console.warn('Could not resolve session for disease recents', error);
      }
    }

    const query = userId ? { user: userId } : {};
    const skip = Math.max(0, (page - 1) * limit);

    const [searches, total] = await Promise.all([
      DiseaseSearch.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .select('searchId query title createdAt'),
      DiseaseSearch.countDocuments(query),
    ]);

    const transformed = searches.map((search) => ({
      searchId: search.searchId,
      title: search.title || search.query,
      symptoms: search.query,
      createdAt: search.createdAt,
    }));

    return NextResponse.json(
      {
        data: transformed,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / Math.max(limit, 1)),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching recent disease searches', error);
    return NextResponse.json({ error: 'Failed to fetch recent disease searches' }, { status: 500 });
  }
}
