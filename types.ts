export enum AppTab {
  EXPLANATION = 'explanation',
  VISUALS = 'visuals',
  SIMULATION = 'simulation',
  VERIFY = 'verify'
}

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

export interface GroundingMetadata {
  webSources: GroundingSource[];
}