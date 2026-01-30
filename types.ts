export interface StyleOption {
  id: number;
  title: string;
  description: string;
  prompt: string;
  thumbnail: string;
}

export type AppState = 'selection' | 'camera' | 'preview' | 'generating' | 'result';
