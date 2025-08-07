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
  isPaused: boolean;
  isAutoStopping: boolean;
  lastSpeechTimestamp: Date | null;
}

export interface SpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  language?: string;
  autoStopOnSilence?: {
    enabled: boolean;
    silenceDuration?: number; // in milliseconds
    onAutoStop?: (transcript: string) => void; // callback when auto-stop occurs
  };
}

export interface SpeechToTextActions {
  startListening: (options?: Partial<SpeechToTextOptions>) => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  abortListening: () => void;
  resetTranscript: () => void;
  clearError: () => void;
}

export interface UseSpeechToTextReturn
  extends SpeechToTextState,
    SpeechToTextActions {}
