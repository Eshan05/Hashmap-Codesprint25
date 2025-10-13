export interface LLMDiseasePayload {
  diseaseName: string;
  diseaseSummary: string;
  laymanTermsSummary: string;
  commonSymptoms: string[];
  transmission: string;
  severity: string;
  progression: string;
  associatedConditions: string[];
  diagnosticProcess: string;
  treatmentSummary: string;
  medications: string[];
  therapiesAndProcedures: string[];
  lifestyleChanges: string[];
  riskFactors: string[];
  preventionStrategies: string[];
  diseaseMechanism: string;
  etiology: string;
  disclaimer: string;
}

export interface DiseaseSearchDocumentCore {
  searchId: string;
  user: string;
  query: string;
  queryHash: string;
  title: string;
  summary: string;
  payload: string;
  status: 'pending' | 'ready' | 'errored';
  errorMessage?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiseaseSearchParsed extends Omit<DiseaseSearchDocumentCore, 'payload'> {
  payload: LLMDiseasePayload;
}
