import { cache, type ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import DiseaseSearch from '@/models/disease-search';
import type { DiseaseSearchParsed, LLMDiseasePayload } from '@/types/disease-search';
import dbConnect from '@/utils/db-conn';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Clock,
  Gauge,
  HeartPulse,
  LifeBuoy,
  Microscope,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';

interface PageProps {
  params: {
    searchId: string;
  };
}

const loadSearch = cache(async (searchId: string): Promise<DiseaseSearchParsed | null> => {
  await dbConnect();
  const doc = await DiseaseSearch.findOne({ searchId });
  if (!doc) {
    return null;
  }

  const { payload, ...rest } = doc.toObject();
  return {
    ...rest,
    payload: doc.getPayload(),
  } as DiseaseSearchParsed;
});

export default async function DiseaseSearchResultPage({ params }: PageProps) {
  const { searchId } = await params;
  const search = await loadSearch(searchId);

  if (!search) {
    notFound();
  }

  if (search.status === 'errored') {
    return (
      <ReportState
        statusLabel="errored"
        tone="destructive"
        title="We could not finish this report"
        description={
          search.errorMessage ||
          'The disease assistant ran into a problem while preparing your briefing. Please try again shortly.'
        }
      />
    );
  }

  if (search.status !== 'ready') {
    return (
      <ReportState
        statusLabel={search.status}
        tone="secondary"
        title="Your disease briefing is generating"
        description="We will refresh this page automatically once your structured summary is complete."
      />
    );
  }

  return <ReportView search={search} payload={search.payload} />;
}

function formatTimestamp(input: unknown): string {
  try {
    return new Date(String(input)).toLocaleString();
  } catch (error) {
    return 'Just now';
  }
}

function ReportView({ search, payload }: { search: DiseaseSearchParsed; payload: LLMDiseasePayload }) {
  const createdAt = formatTimestamp(search.createdAt);
  const duration = typeof search.duration === 'number' ? `${(search.duration / 1000).toFixed(1)}s` : null;

  return (
    <section className="relative min-h-svh overflow-hidden bg-gradient-to-b from-background via-background to-background">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <ReportHero search={search} createdAt={createdAt} duration={duration} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(280px,1fr)]">
          <article className="space-y-6">
            <PatientPrimer payload={payload} />
            <Essentials payload={payload} />
            <TrajectoryOverview payload={payload} />
            <CareGuidance payload={payload} />
            <ClinicalInsights payload={payload} />
          </article>
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Snapshot payload={payload} />
            <SafetyCallout disclaimer={payload.disclaimer} />
          </aside>
        </div>
      </div>
    </section>
  );
}

function ReportHero({
  search,
  createdAt,
  duration,
}: {
  search: DiseaseSearchParsed;
  createdAt: string;
  duration: string | null;
}) {
  return (
    <Card className="relative mb-12 overflow-hidden border border-border/60 bg-[rgba(248,249,251,0.92)] shadow-2xl backdrop-blur-xl dark:bg-[rgba(19,20,24,0.92)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.2),_transparent_50%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.2),_transparent_45%)]" />
      <CardContent className="flex flex-col gap-8 p-6 sm:p-8 md:p-10 lg:p-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="uppercase tracking-wide">
                Disease briefing
              </Badge>
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> Compassion-first insight
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {search.title || payloadHeadingFallback(search.query)}
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                {search.summary ||
                  'A balanced, patient-centric overview covering symptoms, severity, diagnostics, and ways to stay ahead.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="gap-2">
                <Link href="/dashboard/diseases">
                  <ArrowRight className="h-4 w-4" />
                  Start another briefing
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Stethoscope className="h-4 w-4" />
                Share with care team
              </Button>
            </div>
          </div>
          <div className="w-full max-w-xs rounded-3xl border border-border/70 bg-background/80 p-5 shadow-lg backdrop-blur-xl">
            <div className="space-y-4 text-sm text-muted-foreground">
              <HeroStat icon={<Clock className="h-4 w-4" />} label="Generated" value={createdAt} />
              <HeroStat icon={<Microscope className="h-4 w-4" />} label="Focus" value={search.query} />
              {duration ? <HeroStat icon={<Sparkles className="h-4 w-4" />} label="Model runtime" value={duration} /> : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function payloadHeadingFallback(query: string) {
  return query ? `Insights for ${query}` : 'Disease insight overview';
}

function HeroStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background/80 px-3 py-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground/90 break-words">{value}</p>
      </div>
    </div>
  );
}

function PatientPrimer({ payload }: { payload: LLMDiseasePayload }) {
  return (
    <Card className="border border-border/70 bg-background/90 shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="outline" className="uppercase tracking-tight">
            Patient primer
          </Badge>
          <CardTitle className="text-2xl font-semibold">What this condition means</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {payload.laymanTermsSummary || 'A gentle explanation will appear here once the report is ready.'}
          </CardDescription>
        </div>
        <ShieldAlert className="h-10 w-10 text-emerald-400" />
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <div className="rounded-2xl bg-muted/50 p-4">
          <p className="text-muted-foreground">{payload.diseaseSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Also known as</Badge>
          <span className="text-muted-foreground/80">{payload.diseaseName || 'N/A'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Essentials({ payload }: { payload: LLMDiseasePayload }) {
  return (
    <Card className="border border-border/60 bg-background/90 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <HeartPulse className="h-5 w-5 text-rose-500" />
          <CardTitle className="text-xl">Key facts at a glance</CardTitle>
        </div>
        <CardDescription>
          Quick signals about how this condition spreads, how serious it can be, and what to watch for.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FactBlock label="Transmission" value={payload.transmission} />
        <FactBlock label="Severity" value={payload.severity} />
        <FactBlock label="Progression" value={payload.progression} />
        <FactBlock
          label="Common symptoms"
          value={payload.commonSymptoms.length ? payload.commonSymptoms.join(', ') : 'Not specified'}
        />
        <FactBlock
          label="Associated conditions"
          value={payload.associatedConditions.length ? payload.associatedConditions.join(', ') : 'Not specified'}
        />
      </CardContent>
    </Card>
  );
}

function TrajectoryOverview({ payload }: { payload: LLMDiseasePayload }) {
  const severityMeta = classifySeverity(payload.severity, payload.progression);
  const stageHighlights = extractStageHighlights(payload.progression);

  return (
    <Card className="border border-border/60 bg-background/90 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Gauge className={`h-5 w-5 ${severityMeta.iconTone}`} />
          <CardTitle className="text-xl">Trajectory &amp; outlook</CardTitle>
        </div>
        <CardDescription>
          Visual severity signal and key progression cues to discuss with your care team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,260px),1fr]">
          <section className="flex flex-col gap-4">
            <div className="relative mx-auto aspect-square w-full max-w-[220px]">
              <div
                className="absolute inset-0 rounded-full border border-border/40 bg-background/70 shadow-inner"
                style={{
                  backgroundImage: `conic-gradient(${severityMeta.conicColor} 0deg, ${severityMeta.conicColor} ${severityMeta.percent * 3.6}deg, rgba(148,163,184,0.12) ${severityMeta.percent * 3.6}deg)`
                }}
              />
              <div className="absolute inset-[18%] rounded-full border border-border/40 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center gap-1 text-center px-6">
                <span className={`text-xs uppercase tracking-wide ${severityMeta.tone}`}>{severityMeta.label}</span>
                <span className="text-4xl font-semibold text-foreground/90">{severityMeta.percent}</span>
                <span className="text-xs text-muted-foreground">severity index</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/40 p-4 text-sm text-muted-foreground">
              <p>{severityMeta.narrative}</p>
            </div>
          </section>
          <section className="space-y-4">
            <header className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>What the progression suggests</span>
            </header>
            {stageHighlights.length ? (
              <ol className="space-y-3 text-sm text-muted-foreground">
                {stageHighlights.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                Specific progression details were not provided. Use the severity insight to guide monitoring cadence.
              </p>
            )}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

function FactBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 p-4 text-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-muted-foreground leading-relaxed">{value || 'Not specified'}</p>
    </div>
  );
}

function classifySeverity(severityText: string, progressionText: string) {
  const base = (severityText || '').toLowerCase();
  const progression = (progressionText || '').toLowerCase();

  const highIndicators = ['critical', 'life-threatening', 'high risk', 'stage iv', 'advanced', 'severe', 'aggressive'];
  const moderateIndicators = ['moderate', 'progressive', 'requires monitoring', 'unstable', 'stage ii', 'stage iii'];
  const lowIndicators = ['mild', 'low risk', 'manageable', 'stable', 'early', 'stage i'];
  const rapidProgressionHints = ['rapid', 'fast', 'swift', 'acute'];

  let level: 'high' | 'moderate' | 'low' | 'unknown' = 'unknown';

  if (containsAny(base, highIndicators) || containsAny(progression, rapidProgressionHints)) {
    level = 'high';
  } else if (containsAny(base, moderateIndicators) || containsAny(progression, moderateIndicators)) {
    level = 'moderate';
  } else if (containsAny(base, lowIndicators) || containsAny(progression, lowIndicators)) {
    level = 'low';
  }

  switch (level) {
    case 'high':
      return {
        label: 'High concern',
        percent: 86,
        tone: 'text-rose-500 dark:text-rose-400',
        iconTone: 'text-rose-500',
        conicColor: 'rgba(244, 63, 94, 0.7)',
        narrative:
          severityText ||
          'Indicators suggest heightened risk. Discuss urgent warning signs and contingency plans with your clinician.'
      } as const;
    case 'moderate':
      return {
        label: 'Active management',
        percent: 68,
        tone: 'text-amber-500 dark:text-amber-400',
        iconTone: 'text-amber-500',
        conicColor: 'rgba(234, 179, 8, 0.65)',
        narrative:
          severityText ||
          'The condition benefits from consistent follow-up. Track symptoms and interventions to keep progression in check.'
      } as const;
    case 'low':
      return {
        label: 'Manageable',
        percent: 42,
        tone: 'text-emerald-500 dark:text-emerald-400',
        iconTone: 'text-emerald-500',
        conicColor: 'rgba(34, 197, 94, 0.6)',
        narrative:
          severityText ||
          'Current descriptions indicate a manageable outlook. Focus on maintenance habits and scheduled check-ins.'
      } as const;
    default:
      return {
        label: 'Awaiting detail',
        percent: 55,
        tone: 'text-muted-foreground',
        iconTone: 'text-muted-foreground',
        conicColor: 'rgba(148, 163, 184, 0.55)',
        narrative:
          severityText ||
          'Severity language was unclear. Ask your provider to clarify current risk so you can plan monitoring frequency.'
      } as const;
  }
}

function containsAny(source: string, targets: string[]) {
  return targets.some((keyword) => source.includes(keyword));
}

function extractStageHighlights(progressionText: string) {
  const normalized = (progressionText || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [] as string[];
  }

  const cleaned = normalized
    .replace(/[-•]/g, ' ')
    .split(/(?:\.\s+|;|\.|\||\/)/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment.length < 220);

  return cleaned.slice(0, 4);
}

function CareGuidance({ payload }: { payload: LLMDiseasePayload }) {
  return (
    <Card className="border border-border/60 bg-background/90 shadow-lg">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-xl">Plan of care</CardTitle>
          <CardDescription>
            Evidence-based actions you and your care team can discuss to stay ahead of this condition.
          </CardDescription>
        </div>
        <ClipboardList className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-6">
        <CareSection
          title="How it is diagnosed"
          icon={<Microscope className="h-4 w-4" />}
          description={payload.diagnosticProcess}
        />
        <Separator />
        <div className="grid gap-4 md:grid-cols-2">
          <CareList title="Medications often used" items={payload.medications} icon={<Stethoscope className="h-4 w-4" />} />
          <CareList
            title="Therapies & procedures"
            items={payload.therapiesAndProcedures}
            icon={<LifeBuoy className="h-4 w-4" />}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <CareList
            title="Lifestyle support"
            items={payload.lifestyleChanges}
            icon={<HeartPulse className="h-4 w-4" />}
          />
          <CareList
            title="Prevention & risk reduction"
            items={payload.preventionStrategies}
            icon={<ShieldAlert className="h-4 w-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CareSection({ title, icon, description }: { title: string; icon: ReactNode; description: string }) {
  return (
    <section className="space-y-2">
      <header className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        <span>{title}</span>
      </header>
      <p className="text-sm leading-relaxed text-muted-foreground">{description || 'Not specified.'}</p>
    </section>
  );
}

function CareList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-2xl border border-border/50 bg-background/80 p-4">
      <header className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        <span>{title}</span>
      </header>
      {items.length ? (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Not specified.</p>
      )}
    </section>
  );
}

function ClinicalInsights({ payload }: { payload: LLMDiseasePayload }) {
  const hasRiskFactors = payload.riskFactors.length > 0;
  return (
    <Card className="border border-border/60 bg-background/90 shadow-lg">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-xl">Clinical depth</CardTitle>
          <CardDescription>
            Mechanistic insights for clinicians plus risk factors worth documenting.
          </CardDescription>
        </div>
        <BookOpen className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <header className="flex items-center gap-2 font-semibold text-foreground">
            <Microscope className="h-4 w-4" />
            <span>Disease mechanism</span>
          </header>
          <p>{payload.diseaseMechanism || 'Not specified.'}</p>
        </section>
        <section className="space-y-2">
          <header className="flex items-center gap-2 font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Etiology</span>
          </header>
          <p>{payload.etiology || 'Not specified.'}</p>
        </section>
        <Separator />
        <section className="space-y-2">
          <header className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4" />
            <span>Risk factors to document</span>
          </header>
          {hasRiskFactors ? (
            <ul className="space-y-1">
              {payload.riskFactors.map((factor, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No specific risk factors were highlighted.</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function Snapshot({ payload }: { payload: LLMDiseasePayload }) {
  const quickFacts = [
    { label: 'Primary name', value: payload.diseaseName },
    { label: 'Transmission', value: payload.transmission },
    { label: 'Severity', value: payload.severity },
    { label: 'Progression', value: payload.progression },
  ];

  return (
    <Card className="border border-border/60 bg-background/95 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Snapshot</CardTitle>
        <CardDescription>High-level cues to keep on hand during follow-up.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {quickFacts.map((item) => (
          <div key={item.label} className="rounded-xl border border-border/50 bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm text-foreground/90">{item.value || 'Not specified'}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SafetyCallout({ disclaimer }: { disclaimer: string }) {
  return (
    <Card className="border border-border/60 bg-background/95 shadow-md">
      <CardHeader className="flex flex-row items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <div className="space-y-1">
          <CardTitle className="text-lg">Important reminder</CardTitle>
          <CardDescription>
            This briefing supplements—not replaces—professional medical guidance. Always consult your care team before taking
            action.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{disclaimer || 'Consult a licensed clinician for personal advice.'}</p>
      </CardContent>
    </Card>
  );
}

function ReportState({
  statusLabel,
  tone,
  title,
  description,
}: {
  statusLabel: string;
  tone: 'default' | 'secondary' | 'destructive';
  title: string;
  description: string;
}) {
  return (
    <section className="flex min-h-svh items-center justify-center px-6">
      <Card className="max-w-xl border border-border/60 bg-background/90 text-center shadow-xl backdrop-blur-lg">
        <CardHeader className="space-y-4">
          <Badge variant={tone} className="mx-auto w-fit uppercase">
            {statusLabel}
          </Badge>
          <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
          <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild size="sm">
            <Link href="/dashboard/diseases">
              <ArrowRight className="mr-2 h-4 w-4" />
              Start a new briefing
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
