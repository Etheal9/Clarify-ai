
export enum AppTab {
  EXPLANATION = 'explanation',
  VISUALS = 'visuals',
  SIMULATION = 'simulation',
  VERIFY = 'verify'
}

export type MainView = 'learning' | 'test' | 'teach' | 'metrics' | 'projects' | 'history' | 'settings' | 'paste-link';

export type QuestionType = 'choose' | 'fill-blank' | 'match' | 'answer';
export type StudentType = 'normal' | 'argumentative' | 'creative';
export type VisualType = 'diagram' | 'flow' | 'compare' | 'analogy';
export type LanguagePreference = 'en' | 'am' | 'both';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: { name: string; type: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface SourceItem {
  id: string;
  type: 'youtube' | 'pdf' | 'website' | 'image';
  title: string;
  url?: string;
  metadata: string;
  isSelected: boolean;
  file?: File;
  content?: string;
}

export interface MistakeItem {
  id: string;
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  category: string;
  note: string;
  topic: string;
  timestamp: number;
}

export interface QuizResult {
  id: string;
  topic: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  timestamp: number;
}

export interface ExplanationData {
  topic: string;
  intuition: {
    problem: string;
    hook: string;
    localContext: string;
    curiosityGap: string;
  };
  simpleIdea: string;
  analogy: {
    comparison: string;
    explanation: string;
  };
  formal: {
    definitions: { term: string; definition: string }[];
    formulas?: { formula: string; explanation: string }[];
    stepByStep: string[];
  };
  mistakes: {
    wrong: string;
    right: string;
    reason: string;
  }[];
  activeRecall: {
    question: string;
    answer: string;
    feedback: string;
  };
  summary: string[];
}

export interface QuizData {
  topic: string;
  choose: any[];
  fillBlank: any[];
  match: any[];
  answer: any[];
}
