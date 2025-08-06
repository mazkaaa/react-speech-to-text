export interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export interface SpeechToTextStateError {
  code: string;
  message: string;
  name: string;
  browserInfo?: {
    browserName: string;
    reason: string;
  };
}

export interface SpeechToTextState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  results: SpeechToTextResult[];
  error: SpeechToTextStateError | null;
  isInitializing: boolean;
}

export interface SpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  language?: string;
  autoStopOnSilence?: {
    enabled: boolean;
    silenceDuration?: number; // in milliseconds
  };
}

export interface SpeechToTextActions {
  startListening: () => void;
  stopListening: () => void;
  abortListening: () => void;
  resetTranscript: () => void;
  clearError: () => void;
}

export interface UseSpeechToTextReturn
  extends SpeechToTextState,
    SpeechToTextActions {}
