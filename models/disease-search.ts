import mongoose, { Schema, type Document, type Model } from 'mongoose';

import type { DiseaseSearchDocumentCore, LLMDiseasePayload } from '@/types/disease-search';

export interface IDiseaseSearch extends Document, DiseaseSearchDocumentCore {
  getPayload(): LLMDiseasePayload;
}

const DiseaseSearchSchema: Schema = new Schema(
  {
    searchId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    query: { type: String, required: true },
    queryHash: { type: String, default: '', index: true },
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    payload: { type: String, default: '{}' },
    status: { type: String, enum: ['pending', 'ready', 'errored'], default: 'pending' },
    errorMessage: { type: String, default: '' },
    duration: { type: Number },
  },
  {
    timestamps: true,
    collection: 'disease_searches',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

DiseaseSearchSchema.index({ user: 1, queryHash: 1 });

DiseaseSearchSchema.methods.getPayload = function (): LLMDiseasePayload {
  const raw = this.payload;
  const fallback: LLMDiseasePayload = {
    diseaseName: '',
    diseaseSummary: '',
    laymanTermsSummary: '',
    commonSymptoms: [],
    transmission: '',
    severity: '',
    progression: '',
    associatedConditions: [],
    diagnosticProcess: '',
    treatmentSummary: '',
    medications: [],
    therapiesAndProcedures: [],
    lifestyleChanges: [],
    riskFactors: [],
    preventionStrategies: [],
    diseaseMechanism: '',
    etiology: '',
    disclaimer: '',
  };

  if (!raw) {
    return fallback;
  }

  let parsed: Partial<LLMDiseasePayload> | null = null;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as LLMDiseasePayload;
    } catch (error) {
      console.error('Failed to parse payload for DiseaseSearch', error);
    }
  } else {
    parsed = raw as LLMDiseasePayload;
  }

  if (!parsed) {
    return fallback;
  }

  return {
    ...fallback,
    ...parsed,
    commonSymptoms: Array.isArray(parsed.commonSymptoms) ? parsed.commonSymptoms : [],
    associatedConditions: Array.isArray(parsed.associatedConditions) ? parsed.associatedConditions : [],
    medications: Array.isArray(parsed.medications) ? parsed.medications : [],
    therapiesAndProcedures: Array.isArray(parsed.therapiesAndProcedures) ? parsed.therapiesAndProcedures : [],
    lifestyleChanges: Array.isArray(parsed.lifestyleChanges) ? parsed.lifestyleChanges : [],
    riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
    preventionStrategies: Array.isArray(parsed.preventionStrategies) ? parsed.preventionStrategies : [],
  };
};

let DiseaseSearch: Model<IDiseaseSearch>;
try {
  DiseaseSearch = mongoose.model<IDiseaseSearch>('DiseaseSearch');
} catch (error) {
  DiseaseSearch = mongoose.model<IDiseaseSearch>('DiseaseSearch', DiseaseSearchSchema);
}

export default DiseaseSearch;
