export interface DetectedLanguage {
  name: string;
  code: string;
  percentage: number;
  speakers?: string[];
  roleInConversation: string;
}

export interface Speaker {
  name: string;
  primaryLanguage: string;
  languagesUsed?: string[];
  apparentRole?: string;
}

export interface CoreConcept {
  id: string;
  title: string;
  category: string;
  relevanceScore: number;
  description: string;
  speakersInvolved?: string[];
  keyQuotes?: string[];
}

export type RelationshipType = 
  | 'enables'
  | 'reinforces'
  | 'conflicts_with'
  | 'depends_on'
  | 'contextualizes';

export interface ConceptRelationship {
  sourceConceptId?: string;
  sourceConceptTitle: string;
  targetConceptId?: string;
  targetConceptTitle: string;
  relationshipType: RelationshipType | string;
  explanation: string;
}

export interface ConceptualSummary {
  executiveSummary: string;
  relationalSynthesis: string;
  conceptRelationships: ConceptRelationship[];
  causalChains?: string[];
}

export interface KeyTakeaway {
  takeaway: string;
  category: string;
  impactLevel: 'High' | 'Medium' | 'Strategic' | string;
  speakerAttribution?: string;
}

export interface DefinitionItem {
  term: string;
  originalLanguage?: string;
  formalDefinition: string;
  appliedContext: string;
}

export interface TechnicalJargon {
  jargon: string;
  domain: string;
  standardMeaning: string;
  practicalImplication: string;
  occurrenceQuote?: string;
}

export interface DecisionAction {
  decisionOrAction: string;
  owner?: string;
  status?: string;
}

export interface StructuredNotes {
  keyTakeaways: KeyTakeaway[];
  definitions: DefinitionItem[];
  technicalJargon: TechnicalJargon[];
  decisionsAndNextSteps?: DecisionAction[];
}

export interface ContextDependentConcept {
  term: string;
  language: string;
  literalTranslation: string;
  contextualMeaning: string;
  culturalNuance: string;
  whyDirectTranslationFails: string;
  strategicImpactOnDiscussion?: string;
}

export interface CodeSwitchingDynamic {
  speaker: string;
  shiftDescription: string;
  triggerContext: string;
  pragmaticReason: string;
}

export interface LanguageInsights {
  overview: string;
  contextDependentConcepts: ContextDependentConcept[];
  codeSwitchingDynamics: CodeSwitchingDynamic[];
  crossCulturalRecommendations?: string[];
}

export interface AnalysisResult {
  detectedLanguages: DetectedLanguage[];
  speakers?: Speaker[];
  coreConcepts: CoreConcept[];
  conceptualSummary: ConceptualSummary;
  structuredNotes: StructuredNotes;
  languageInsights: LanguageInsights;
}
