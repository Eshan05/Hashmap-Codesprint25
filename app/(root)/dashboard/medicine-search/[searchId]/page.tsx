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
import MedicineSearch from '@/models/medicine-search';
import type {
  ComparisonRow,
  ComparisonValue,
  LLMMedicineCommonPayload,
  LLMMedicineDiseasePayload,
  LLMMedicineIngredientPayload,
  LLMMedicineModePayload,
  LLMMedicineNamePayload,
  LLMMedicineSideEffectsPayload,
  LLMMedicineSimilarPayload,
  MedicineSearchMode,
  MedicineSearchParsed,
  SideEffectCulprit,
  TherapyOption,
} from '@/types/medicine-search';
import dbConnect from '@/utils/db-conn';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Clock,
  FlaskConical,
  Gauge,
  Pill,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Wallet,
} from 'lucide-react';

interface PageProps {
  params: {
    searchId: string;
  };
}

const loadSearch = cache(async (searchId: string): Promise<MedicineSearchParsed | null> => {
  await dbConnect();
  const doc = await MedicineSearch.findOne({ searchId });
  if (!doc) {
    return null;
  }

  const { commonPayload, modePayload, ...rest } = doc.toObject();

  return {
    ...rest,
    common: doc.getCommonPayload(),
    modeSpecific: doc.getModePayload<LLMMedicineModePayload>(),
  } as MedicineSearchParsed;
});

export default async function MedicineSearchResultPage({ params }: PageProps) {
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
        title="We could not complete this analysis"
        description={
          search.errorMessage ||
          'The clinical assistant was unable to finish this report. Please try again in a few minutes.'
        }
      />
    );
  }

  if (search.status !== 'ready') {
    return (
      <ReportState
        statusLabel={search.status}
        tone="secondary"
        title="Your medicine report is still generating"
        description="We will refresh this page automatically once the structured analysis is ready."
      />
    );
  }

  const mode = search.searchType as MedicineSearchMode;

  return (
    <section className="relative min-h-svh overflow-hidden bg-gradient-to-b from-background via-background to-background">
      <div className="mx-auto w-full px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <ReportHero search={search} />

        <div className="grid max-w-6xl mx-auto gap-6 lg:grid-cols-[minmax(0,2fr),minmax(280px,1fr)]">
          <article className="space-y-6">
            <CommonInsights search={search} />
            <ModeSpecific mode={mode} payload={search.modeSpecific} />
          </article>
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <SessionDetails search={search} />
            <SafetyCallout />
          </aside>
        </div>
      </div>
    </section>
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
            <Link href="/dashboard/medicine-search">
              <ArrowRight className="mr-2 h-4 w-4" />
              Start a new search
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function ReportHero({ search }: { search: MedicineSearchParsed }) {
  const timestamp = formatTimestamp(search.createdAt);
  const duration = typeof search.duration === 'number' ? `${(search.duration / 1000).toFixed(1)}s` : null;

  return (
    <Card className="overflow-hidden border border-neutral-800/60 bg-neutral-950 text-neutral-100 shadow-2xl dark:border-neutral-800 py-0 max-w-7xl mx-auto mb-8"
      style={{
        background:
          'url(https://images.unsplash.com/photo-1653826531670-3a0ce374c725?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.2),_transparent_45%)]" />
      <CardContent className="flex flex-col gap-8 p-6 sm:p-8 md:p-10 lg:p-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="uppercase tracking-wide">
                {search.searchType}
              </Badge>
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> Medicine intelligence
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {search.title || 'Medicine analysis overview'}
              </h1>
              <p className="text-base text-neutral-200/90 sm:text-lg">
                {search.summary || 'Structured insights for cross-referencing treatment decisions and safety cues.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="gap-2">
                <Link href="/dashboard/medicine-search">
                  <ArrowRight className="h-4 w-4" />
                  Run another query
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-primary">
                <Stethoscope className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
          <div className="w-full max-w-xs rounded-3xl border border-border/70 bg-background/80 p-5 shadow-lg backdrop-blur-xl">
            <div className="space-y-4">
              <HeroStat icon={<Clock className="h-4 w-4" />} label="Generated" value={timestamp} />
              {/* <HeroStat icon={<Gauge className="h-4 w-4" />} label="Status" value="Ready" /> */}
              <HeroStat icon={<Pill className="h-4 w-4" />} label="Request" value={search.query} />
              {/* {duration ? <HeroStat icon={<Activity className="h-4 w-4" />} label="Completion" value={duration} /> : null} */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommonInsights({ search }: { search: MedicineSearchParsed }) {
  const { common } = search;

  return (
    <Card className="border border-border/60 bg-background/80 shadow-lg backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-2xl">Clinical overview</CardTitle>
          <CardDescription>
            A friendly walk-through for patients, followed by deeper clinician-grade details.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <PatientPrimer common={common} />

        {common.keyTakeaways?.length ? (
          <InsightSection
            title="Key points to remember"
            description="These are the most important highlights in everyday language."
          >
            <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              {common.keyTakeaways.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {common.patientCounseling?.length ? (
          <InsightSection
            title="How to use it safely"
            description="Share these reminders with anyone helping you take this medicine."
          >
            <ul className="space-y-2 text-sm text-muted-foreground">
              {common.patientCounseling.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 px-2 py-0 text-[10px] uppercase">
                    tip
                  </Badge>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {common.interactionNotes?.length ? (
          <InsightSection
            title="Medicines & substances to mention"
            description="Let your doctor or pharmacist know if you use anything on this list."
          >
            <div className="space-y-3">
              {common.interactionNotes.map((note, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{note.interactingAgent}</p>
                  <p className="mt-1 text-muted-foreground">{note.effect}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Care team advice:</span> {note.recommendation}
                  </p>
                  {note.evidenceLevel ? (
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                      Evidence {note.evidenceLevel}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {common.clinicalActions?.length ? (
          <InsightSection
            title="Clinician follow-up plan"
            description="Professional steps your care team may take next."
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {common.clinicalActions.map((action, idx) => (
                <div key={idx} className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{action.title}</p>
                    <Badge variant={priorityVariant(action.priority)} className="uppercase">
                      {action.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{action.rationale}</p>
                  {action.evidenceLevel ? (
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Evidence {action.evidenceLevel}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {common.riskAlerts?.length ? (
          <InsightSection
            title="Watch-outs"
            description="Keep an eye on these situations and call a professional if they pop up."
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {common.riskAlerts.map((risk, idx) => (
                <div key={idx} className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className="font-semibold">{risk.name}</p>
                    </div>
                    <Badge variant={severityVariant(risk.severity)} className="uppercase">
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{risk.mitigation}</p>
                  {risk.triggerNotes?.length ? (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {risk.triggerNotes.map((note, noteIdx) => (
                        <li key={noteIdx} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive/70" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {common.monitoringGuidance?.length ? (
          <InsightSection
            title="Check-ins your clinician may order"
            description="Tests or measurements that help track how things are going."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {common.monitoringGuidance.map((tip, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{tip.metric}</p>
                  <p className="text-muted-foreground">{tip.frequency}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{tip.note}</p>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {common.followUpPrompts?.length ? (
          <InsightSection
            title="Questions to ask next"
            description="Bring these to your next appointment or telehealth visit."
          >
            <ul className="space-y-2 text-sm text-muted-foreground">
              {common.followUpPrompts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 px-2 py-0 text-[10px] uppercase">
                    ask
                  </Badge>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {common.references?.length ? (
          <InsightSection
            title="Sources we consulted"
            description="Share these citations with your clinician if they would like to review the research."
          >
            <ul className="space-y-2 text-sm text-muted-foreground">
              {common.references.map((ref, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{ref.label}</p>
                    {ref.citation ? <p className="text-xs text-muted-foreground">{ref.citation}</p> : null}
                    {ref.url ? (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Open source
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        <InsightSection
          title="Clinician summary"
          description="The full technical summary for healthcare professionals."
        >
          <p className="text-sm leading-relaxed text-muted-foreground">{common.summary}</p>
        </InsightSection>

        <Separator />
        <p className="text-xs leading-relaxed text-muted-foreground">{common.disclaimer}</p>
      </CardContent>
    </Card>
  );
}

function ModeSpecific({ mode, payload }: { mode: MedicineSearchMode; payload: LLMMedicineModePayload }) {
  if (!payload) {
    return null;
  }

  switch (mode) {
    case 'disease':
      return <DiseaseInsights payload={payload as LLMMedicineDiseasePayload} />;
    case 'name':
      return <NameInsights payload={payload as LLMMedicineNamePayload} />;
    case 'sideEffects':
      return <SideEffectInsights payload={payload as LLMMedicineSideEffectsPayload} />;
    case 'ingredient':
      return <IngredientInsights payload={payload as LLMMedicineIngredientPayload} />;
    case 'similar':
      return <SimilarInsights payload={payload as LLMMedicineSimilarPayload} />;
    default:
      return null;
  }
}

function DiseaseInsights({ payload }: { payload: LLMMedicineDiseasePayload }) {
  const {
    pathophysiologySnapshot,
    firstLineTherapies = [],
    secondLineOptions = [],
    combinationStrategies = [],
    monitoringPlan = [],
    nonPharmacologicAdjuncts = [],
    redFlags = [],
  } = payload;

  return (
    <Card className="border border-border/60 bg-background/80 shadow-lg backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Disease-focused guidance</CardTitle>
        <CardDescription>Therapeutic framing across acute and maintenance strategies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <InsightSection title="Pathophysiology snapshot">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {pathophysiologySnapshot || 'No pathophysiology commentary was provided.'}
          </p>
        </InsightSection>

        <TreatmentRail title="First-line therapies" items={firstLineTherapies} />
        <TreatmentRail title="Second-line options" items={secondLineOptions} />
        <TreatmentRail title="Combination strategies" items={combinationStrategies} />

        {monitoringPlan.length ? (
          <InsightSection title="Monitoring plan">
            <div className="grid gap-3 md:grid-cols-2">
              {monitoringPlan.map((tip, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{tip.metric}</p>
                  <p className="text-muted-foreground">{tip.frequency}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{tip.note}</p>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {nonPharmacologicAdjuncts.length ? (
          <InsightSection title="Non-pharmacologic adjuncts">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {nonPharmacologicAdjuncts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <FlaskConical className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {redFlags.length ? (
          <InsightSection title="Red flags">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {redFlags.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}
      </CardContent>
    </Card>
  );
}

function NameInsights({ payload }: { payload: LLMMedicineNamePayload }) {
  const {
    mechanism,
    primaryIndications = [],
    formulations = [],
    dosingGuidance = [],
    doseAdjustments = [],
    contraindications = [],
    blackBoxWarnings = [],
    commonSideEffects = [],
    seriousSideEffects = [],
    monitoringParameters = [],
    patientCounselingPoints = [],
  } = payload;

  return (
    <Card className="border border-border/60 bg-background/80 shadow-lg backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Agent profile</CardTitle>
        <CardDescription>Plain-language facts for everyday use, followed by clinician-ready detail.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <MedicineSnapshot payload={payload} />

        <InsightSection
          title="How it works in your body"
          description="An everyday explanation of what the medicine is doing."
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            {mechanism || 'No mechanism details were provided.'}
          </p>
        </InsightSection>

        {primaryIndications.length ? (
          <InsightSection
            title="Why doctors use it"
            description="Common situations where this medicine is prescribed."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {primaryIndications.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{item.condition}</p>
                  <p className="text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {formulations.length ? (
          <InsightSection
            title="How it’s available"
            description="Typical forms and strengths you might see at the pharmacy."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {formulations.map((form, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{form.form}</p>
                  <p className="text-muted-foreground">Strengths: {form.strengths.join(', ')}</p>
                  {form.release ? <p className="text-xs text-muted-foreground">Release: {form.release}</p> : null}
                  {form.notes ? <p className="text-xs text-muted-foreground">{form.notes}</p> : null}
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {dosingGuidance.length ? (
          <InsightSection
            title="Typical dosing examples"
            description="Actual dosing comes from your clinician; these examples show the general pattern."
          >
            <div className="space-y-3">
              {dosingGuidance.map((dose, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{dose.population}</p>
                  <p className="text-muted-foreground">{dose.dose} · {dose.frequency}</p>
                  {dose.maxDose ? <p className="text-xs text-muted-foreground">Max: {dose.maxDose}</p> : null}
                  {dose.titration ? <p className="text-xs text-muted-foreground">Titration: {dose.titration}</p> : null}
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {doseAdjustments.length ? (
          <InsightSection
            title="When doses change"
            description="Factors that might make your doctor raise or lower the dose."
          >
            <div className="space-y-3">
              {doseAdjustments.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{item.factor}</p>
                  <p className="text-muted-foreground">{item.recommendation}</p>
                  {item.rationale ? <p className="text-xs text-muted-foreground">{item.rationale}</p> : null}
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        <InsightSection title="Safety">
          <div className="grid gap-4 md:grid-cols-2">
            <SafetyList title="Contraindications" items={contraindications} />
            <SafetyList title="Black box warnings" items={blackBoxWarnings} variant="destructive" />
            <SafetyList title="Common side effects" items={commonSideEffects} />
            <SafetyList title="Serious side effects" items={seriousSideEffects} variant="destructive" />
          </div>
        </InsightSection>

        {monitoringParameters.length ? (
          <InsightSection
            title="What your care team may monitor"
            description="Lab work or vitals that help them check your progress."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {monitoringParameters.map((tip, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{tip.metric}</p>
                  <p className="text-muted-foreground">{tip.frequency}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{tip.note}</p>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {patientCounselingPoints.length ? (
          <InsightSection
            title="Everyday reminders from clinicians"
            description="Bring these into your routine to stay on track."
          >
            <ul className="space-y-2 text-sm text-muted-foreground">
              {patientCounselingPoints.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 px-2 py-0 text-[10px] uppercase">
                    counsel
                  </Badge>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SideEffectInsights({ payload }: { payload: LLMMedicineSideEffectsPayload }) {
  const {
    likelyCulprits = [],
    mechanisticInsights,
    managementStrategies = [],
    alternativeOptions = [],
    whenToEscalate = [],
    documentationTips = [],
  } = payload;

  return (
    <Card className="border border-border/60 bg-background/80 shadow-lg backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Adverse effect analysis</CardTitle>
        <CardDescription>Root-cause hypotheses with mitigation sequences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {likelyCulprits.length ? (
          <InsightSection title="Likely culprits">
            <div className="space-y-3">
              {likelyCulprits.map((culprit, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{culprit.drugName}</p>
                    <Badge variant={likelihoodVariant(culprit.likelihood)} className="uppercase">
                      {culprit.likelihood}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{culprit.mechanism}</p>
                  <p className="text-xs text-muted-foreground">Onset: {culprit.onsetTiming}</p>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        <InsightSection title="Mechanistic insights">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {mechanisticInsights || 'No mechanistic commentary was provided.'}
          </p>
        </InsightSection>

        {managementStrategies.length ? (
          <InsightSection title="Management strategies">
            <div className="space-y-3">
              {managementStrategies.map((strategy, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{strategy.strategy}</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {strategy.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                  {strategy.monitoring ? (
                    <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                      Monitoring: {strategy.monitoring}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {alternativeOptions.length ? (
          <InsightSection title="Alternative options">
            <div className="space-y-3">
              {alternativeOptions.map((option, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{option.name}</p>
                  <p className="text-muted-foreground">{option.comparison}</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Pros</p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {option.pros.map((pro, proIdx) => (
                          <li key={proIdx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Cons</p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {option.cons.map((con, conIdx) => (
                          <li key={conIdx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive/70" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {whenToEscalate.length ? (
          <InsightSection title="Escalation guidance">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {whenToEscalate.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {documentationTips.length ? (
          <InsightSection title="Documentation tips">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {documentationTips.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ClipboardList className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}
      </CardContent>
    </Card>
  );
}

function IngredientInsights({ payload }: { payload: LLMMedicineIngredientPayload }) {
  const {
    products = [],
    brandEquivalents = [],
    therapeuticClasses = [],
    formulationDetails = [],
    regulatoryNotes = [],
    availabilityConsiderations = [],
    qualityFlags = [],
  } = payload;

  return (
    <Card className="border border-border/60 bg-background/80 shadow-lg backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Ingredient intelligence</CardTitle>
        <CardDescription>Formulary coverage, equivalence, and regulatory context.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {products.length ? (
          <InsightSection title="Products">
            <div className="space-y-3">
              {products.map((product, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{product.productName}</p>
                    <Badge variant="outline">{product.form}</Badge>
                    <Badge variant={product.otc ? 'secondary' : 'default'}>{product.otc ? 'OTC' : 'RX'}</Badge>
                  </div>
                  <p className="text-muted-foreground">Strength: {product.strength}</p>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {brandEquivalents.length ? (
          <InsightSection title="Brand equivalents">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {brandEquivalents.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Pill className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {therapeuticClasses.length ? (
          <InsightSection title="Therapeutic classes">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {therapeuticClasses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 px-2 py-0 text-[10px] uppercase">
                    class
                  </Badge>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {formulationDetails.length ? (
          <InsightSection title="Formulation details">
            <div className="grid gap-3 md:grid-cols-2">
              {formulationDetails.map((form, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{form.form}</p>
                  <p className="text-muted-foreground">Strengths: {form.strengths.join(', ')}</p>
                  {form.release ? <p className="text-xs text-muted-foreground">Release: {form.release}</p> : null}
                  {form.notes ? <p className="text-xs text-muted-foreground">{form.notes}</p> : null}
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {regulatoryNotes.length ? (
          <InsightSection title="Regulatory notes">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {regulatoryNotes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {availabilityConsiderations.length ? (
          <InsightSection title="Availability considerations">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {availabilityConsiderations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {qualityFlags.length ? (
          <InsightSection title="Quality flags">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {qualityFlags.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 px-2 py-0 text-[10px] uppercase">
                    quality
                  </Badge>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SimilarInsights({ payload }: { payload: LLMMedicineSimilarPayload }) {
  const {
    alternatives = [],
    comparisonMatrix = [],
    switchingGuidance = [],
    costConsiderations = [],
    transitionRisks = [],
    monitoringAfterSwitch = [],
  } = payload;

  const headerAlternatives: ComparisonValue[] = comparisonMatrix[0]?.alternatives ?? [];

  return (
    <Card className="border border-border/60 bg-background/80 shadow-lg backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Comparable options</CardTitle>
        <CardDescription>Cross-agent review with switching considerations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {alternatives.length ? (
          <InsightSection title="Alternative summaries">
            <div className="space-y-3">
              {alternatives.map((option, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{option.name}</p>
                  <p className="text-muted-foreground">{option.comparison}</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Pros</p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {option.pros.map((pro, proIdx) => (
                          <li key={proIdx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Cons</p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {option.cons.map((con, conIdx) => (
                          <li key={conIdx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive/70" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}

        {comparisonMatrix.length ? (
          <InsightSection title="Comparison matrix">
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/70 bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 font-medium text-muted-foreground">Attribute</th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">Baseline</th>
                    {headerAlternatives.map((alt, idx) => (
                      <th key={idx} className="px-3 py-2 font-medium text-muted-foreground">
                        {alt.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonMatrix.map((row: ComparisonRow, idx) => (
                    <tr key={idx} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 font-medium text-foreground">{row.attribute}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.baseline}</td>
                      {row.alternatives.map((alt: ComparisonValue, altIdx: number) => (
                        <td key={altIdx} className="px-3 py-2 text-muted-foreground">
                          {alt.detail}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InsightSection>
        ) : null}

        {switchingGuidance.length ? (
          <InsightSection title="Switching guidance">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {switchingGuidance.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {costConsiderations.length ? (
          <InsightSection title="Cost considerations">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {costConsiderations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {transitionRisks.length ? (
          <InsightSection title="Transition risks">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {transitionRisks.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InsightSection>
        ) : null}

        {monitoringAfterSwitch.length ? (
          <InsightSection title="Post-switch monitoring">
            <div className="grid gap-3 md:grid-cols-2">
              {monitoringAfterSwitch.map((tip, idx) => (
                <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{tip.metric}</p>
                  <p className="text-muted-foreground">{tip.frequency}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{tip.note}</p>
                </div>
              ))}
            </div>
          </InsightSection>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SessionDetails({ search }: { search: MedicineSearchParsed }) {
  const timestamp = formatTimestamp(search.createdAt);
  const duration = typeof search.duration === 'number' ? `${(search.duration / 1000).toFixed(1)} seconds` : '—';

  return (
    <Card className="border border-border/60 bg-background/80 shadow-lg backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-lg">Session details</CardTitle>
        <CardDescription>Metadata captured for this session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div>
          <p className="text-xs uppercase tracking-wide">Query</p>
          <p className="font-medium text-foreground">{search.query}</p>
        </div>
        <Separator />
        <div className="space-y-3">
          <SessionRow label="Search ID" value={search.searchId} monospace />
          <SessionRow label="Generated" value={timestamp} />
          <SessionRow label="Status" value={search.status} />
          <SessionRow label="Duration" value={duration} />
        </div>
      </CardContent>
    </Card>
  );
}

function SafetyCallout() {
  return (
    <Card className="border border-border/60 bg-muted/40 shadow-lg backdrop-blur-xl">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Safety reminder
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Use these insights as decision support. Confirm recommendations with authoritative references and
          patient-specific data before updating care plans.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function PatientPrimer({ common }: { common: LLMMedicineCommonPayload }) {
  const friendlySummary = buildFriendlySummary(common);
  const everydayTakeaways = (common.keyTakeaways ?? []).filter(Boolean).slice(0, 3);
  const counselingClips = (common.patientCounseling ?? []).filter(Boolean).slice(0, 3);

  return (
    <section className="rounded-3xl border border-border/60 bg-muted/30 p-5 sm:p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" />
          Quick take
        </div>
        <h2 className="text-xl font-semibold text-foreground">What this means for you</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{friendlySummary}</p>
        {common.bodyMechanismSummary ? (
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">How it works inside you</p>
            <p className="mt-2 text-sm text-foreground">{ensureSentence(common.bodyMechanismSummary)}</p>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          This snapshot keeps the language simple so you can make sense of the results before diving into the
          clinician details below.
        </p>
      </div>

      {(everydayTakeaways.length || counselingClips.length) ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {everydayTakeaways.length ? (
            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Most helpful points
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {everydayTakeaways.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {counselingClips.length ? (
            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Everyday guidance
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {counselingClips.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function MedicineSnapshot({ payload }: { payload: LLMMedicineNamePayload }) {
  const primary = payload.primaryIndications?.[0];
  const formulation = payload.formulations?.[0];
  const commonSideEffects = (payload.commonSideEffects ?? []).filter(Boolean).slice(0, 2);
  const monitor = payload.monitoringParameters?.[0];

  const snapshot = [
    primary && {
      icon: <Stethoscope className="h-4 w-4" />,
      label: 'Primary use',
      value: primary.condition,
      description: primary.note,
    },
    formulation && {
      icon: <Pill className="h-4 w-4" />,
      label: 'Common form',
      value: `${formulation.form}${formulation.strengths?.length ? ` · ${formulation.strengths[0]}` : ''}`,
      description: formulation.notes || formulation.release,
    },
    commonSideEffects.length && {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'Frequent side effects',
      value: commonSideEffects.join(', '),
      description: 'Tell your clinician if any become severe.',
    },
    monitor && {
      icon: <ClipboardList className="h-4 w-4" />,
      label: 'Likely monitoring',
      value: monitor.metric,
      description: `${monitor.frequency}${monitor.note ? ` · ${monitor.note}` : ''}`,
    },
  ].filter(Boolean) as Array<{
    icon: ReactNode;
    label: string;
    value: string;
    description?: string;
  }>;

  if (!snapshot.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-muted/30 p-5 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Fast facts</p>
        <p className="text-sm text-muted-foreground">Keep these quick notes in mind before diving deeper.</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {snapshot.map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-border/60 bg-background/60 p-4 text-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="text-primary">{item.icon}</span>
              {item.label}
            </div>
            <p className="mt-2 font-semibold text-foreground">{item.value}</p>
            {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function InsightSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function TreatmentRail({ title, items }: { title: string; items: TherapyOption[] }) {
  if (!items?.length) {
    return null;
  }

  return (
    <InsightSection title={title}>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
            <p className="font-semibold text-foreground">{item.name}</p>
            <p className="text-muted-foreground">{item.rationale}</p>
            {item.cautions?.length ? (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {item.cautions.map((caution, cautionIdx) => (
                  <li key={cautionIdx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive/70" />
                    <span>{caution}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {item.evidenceLevel ? (
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                Evidence {item.evidenceLevel}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </InsightSection>
  );
}

function SafetyList({
  title,
  items,
  variant = 'default',
}: {
  title: string;
  items: string[];
  variant?: 'default' | 'destructive';
}) {
  if (!items.length) {
    return null;
  }

  const badgeVariant = variant === 'destructive' ? 'destructive' : 'secondary';

  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Badge variant={badgeVariant} className="px-2 py-0 text-[10px] uppercase">
          {title}
        </Badge>
      </div>
      <ul className="space-y-1 text-muted-foreground">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SessionRow({ label, value, monospace }: { label: string; value: string; monospace?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={monospace ? 'font-mono text-xs text-foreground' : 'font-medium text-foreground'}>{value}</p>
    </div>
  );
}

function HeroStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function formatTimestamp(input: Date | string | number | undefined): string {
  if (!input) {
    return 'Not available';
  }

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function buildFriendlySummary(common: LLMMedicineCommonPayload): string {
  // if (common.bodyMechanismSummary?.trim()) {
  //   return ensureSentence(common.bodyMechanismSummary.trim());
  // }

  // const counseling = (common.patientCounseling ?? []).filter(Boolean);
  // if (counseling.length) {
  //   return ensureSentence(counseling.slice(0, 2).join(' '));
  // }

  // const takeaways = (common.keyTakeaways ?? []).filter(Boolean);
  // if (takeaways.length) {
  //   return ensureSentence(takeaways[0]);
  // }

  if (common.summary?.trim()) {
    return ensureSentence(common.summary.trim());
  }

  return 'We will add a plain-language explanation once more information is available.';
}

function ensureSentence(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'No plain-language summary is available yet.';
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function priorityVariant(priority: 'urgent' | 'soon' | 'routine') {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'soon':
      return 'default';
    default:
      return 'secondary';
  }
}

function severityVariant(severity: 'low' | 'moderate' | 'high') {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'moderate':
      return 'default';
    default:
      return 'secondary';
  }
}

function likelihoodVariant(likelihood: SideEffectCulprit['likelihood']) {
  switch (likelihood) {
    case 'definite':
      return 'destructive';
    case 'probable':
      return 'default';
    default:
      return 'secondary';
  }
}
