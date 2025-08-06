import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SpeechRecognition,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  SpeechToTextOptions,
  SpeechToTextResult,
  SpeechToTextState,
  UseSpeechToTextReturn,
} from "./types";

/**
 * Custom hook for speech-to-text functionality using the Web Speech API.
 * It provides methods to start, stop, and manage speech recognition,
 * as well as handling browser compatibility and errors.
 * This hook is designed to be used in React applications
 * and provides a simple interface for integrating speech recognition.
 * @param initialOptions - Optional initial configuration for speech recognition.
 * It can include options like language, continuous mode, interim results, etc.
 * @returns An object containing the current state of speech recognition,
 * methods to control the recognition process, and error handling.
 */
export const useSpeechToText = (
  initialOptions?: Partial<SpeechToTextOptions>
): UseSpeechToTextReturn => {
  const [state, setState] = useState<SpeechToTextState>({
    isListening: false,
    isSupported: false,
    transcript: "",
    interimTranscript: "",
    finalTranscript: "",
    results: [],
    error: null,
    isInitializing: true,
  });

  // Default options
  const DEFAULT_OPTIONS: SpeechToTextOptions = {
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
    language: "en-US",
    autoStopOnSilence: {
      enabled: false,
      silenceDuration: 3000, // Default to 3 seconds
    },
  };

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastSpeechTimeRef = useRef<Date | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const transcriptRef = useRef<{ final: string; interim: string }>({
    final: "",
    interim: "",
  });
  const optionsRef = useRef<SpeechToTextOptions>({
    ...DEFAULT_OPTIONS,
    ...initialOptions,
  });

  /**
   * Helper function to get the SpeechRecognition constructor
   * from the global window object.
   * returns null if not available.
   */
  const getBrowserSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    return (
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition ||
      null
    );
  }, []);

  /**
   * Checks browser compatibility for the Web Speech API.
   * returns an object with:
   * - isSupported: boolean indicating if the browser supports speech recognition
   * - browserName: string indicating the browser name
   * - reason: string explaining why it is or isn't supported
   */
  const checkBrowserCompatibility = useCallback(() => {
    if (typeof window === "undefined") {
      return {
        isSupported: false,
        browserName: "Unknown",
        reason: "Not running in browser environment",
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();

    // Detect specific browsers
    const isBrave =
      "brave" in navigator &&
      (navigator as unknown as { brave: unknown }).brave !== undefined;
    const isChrome =
      userAgent.includes("chrome") && !userAgent.includes("edg") && !isBrave;
    const isEdge = userAgent.includes("edg");
    const isSafari =
      userAgent.includes("safari") && !userAgent.includes("chrome");
    const isFirefox = userAgent.includes("firefox");
    const isOpera = userAgent.includes("opr") || userAgent.includes("opera");

    // Check if Speech Recognition constructor exists
    const speechRecognitionExists = getBrowserSpeechRecognition() !== null;

    // Brave Browser - explicitly not supported
    if (isBrave) {
      return {
        isSupported: false,
        browserName: "Brave",
        reason:
          "Brave Browser does not support Web Speech API for privacy reasons",
      };
    }

    // Firefox - limited/no support
    if (isFirefox) {
      return {
        isSupported: false,
        browserName: "Firefox",
        reason: "Firefox does not support Web Speech API",
      };
    }

    // Opera - limited support
    if (isOpera) {
      return {
        isSupported: speechRecognitionExists,
        browserName: "Opera",
        reason: speechRecognitionExists
          ? ""
          : "Opera has limited Web Speech API support",
      };
    }

    // Chrome - full support
    if (isChrome) {
      return {
        isSupported: speechRecognitionExists,
        browserName: "Chrome",
        reason: speechRecognitionExists
          ? ""
          : "Chrome should support Web Speech API but it's not available",
      };
    }

    // Edge - full support
    if (isEdge) {
      return {
        isSupported: speechRecognitionExists,
        browserName: "Edge",
        reason: speechRecognitionExists
          ? ""
          : "Edge should support Web Speech API but it's not available",
      };
    }

    // Safari - full support (iOS 14.5+, macOS Safari 14.1+)
    if (isSafari) {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isMac = /(Macintosh|Mac OS)/.test(navigator.userAgent);

      if (isMobile) {
        // Check iOS version
        const iosVersion = navigator.userAgent.match(/OS (\d+)_(\d+)/);
        if (iosVersion) {
          const majorVersion = Number.parseInt(iosVersion[1], 10);
          const minorVersion = Number.parseInt(iosVersion[2], 10);
          const isSupported =
            majorVersion > 14 || (majorVersion === 14 && minorVersion >= 5);

          return {
            isSupported: isSupported && speechRecognitionExists,
            browserName: "Safari (iOS)",
            reason: !isSupported
              ? "Web Speech API requires iOS 14.5 or later"
              : !speechRecognitionExists
              ? "Web Speech API is not available"
              : "",
          };
        }
      }

      if (isMac) {
        return {
          isSupported: speechRecognitionExists,
          browserName: "Safari (macOS)",
          reason: speechRecognitionExists
            ? ""
            : "Web Speech API requires Safari 14.1 or later",
        };
      }

      return {
        isSupported: speechRecognitionExists,
        browserName: "Safari",
        reason: speechRecognitionExists
          ? ""
          : "Web Speech API may not be supported on this Safari version",
      };
    }

    // Unknown browser - check if API exists
    return {
      isSupported: speechRecognitionExists,
      browserName: "Unknown Browser",
      reason: speechRecognitionExists
        ? ""
        : "This browser does not support Web Speech API",
    };
  }, [getBrowserSpeechRecognition]);

  /**
   * Resets the silence timeout.
   * If autoStopOnSilence is enabled, it sets a timeout to stop recognition after
   */
  const resetSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (optionsRef.current.autoStopOnSilence?.enabled) {
      silenceTimeoutRef.current = window.setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        // Call onAutoStop callback if provided
        if (
          optionsRef.current.autoStopOnSilence?.onAutoStop &&
          transcriptRef.current.final
        ) {
          optionsRef.current.autoStopOnSilence.onAutoStop(
            transcriptRef.current.final
          );
        }
      }, optionsRef.current.autoStopOnSilence.silenceDuration);
    }
  }, []);

  /**
   * Initializes the SpeechRecognition instance.
   * Sets up event handlers and applies options.
   */
  const initializeSpeechRecognition = useCallback(() => {
    // First, run comprehensive browser compatibility check
    const browserCheck = checkBrowserCompatibility();

    if (!browserCheck.isSupported) {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        isInitializing: false,
        error: {
          code: "NOT_SUPPORTED",
          message: browserCheck.reason,
          name: "NotSupportedError",
          browserInfo: {
            browserName: browserCheck.browserName,
            reason: browserCheck.reason,
          },
        },
      }));
      return null;
    }

    const SpeechRecognitionConstructor = getBrowserSpeechRecognition();

    if (!SpeechRecognitionConstructor) {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        isInitializing: false,
        error: {
          code: "NOT_SUPPORTED",
          message: "Speech recognition is not supported in this browser",
          name: "NotSupportedError",
          browserInfo: {
            browserName: browserCheck.browserName,
            reason: "Web Speech API constructor not found",
          },
        },
      }));
      return null;
    }

    try {
      const recognition = new SpeechRecognitionConstructor();

      // Apply options
      recognition.continuous = optionsRef.current.continuous ?? true;
      recognition.interimResults = optionsRef.current.interimResults ?? true;
      recognition.maxAlternatives = optionsRef.current.maxAlternatives ?? 1;
      recognition.lang = optionsRef.current.language ?? "en-US";

      // Event handlers
      recognition.onstart = () => {
        lastSpeechTimeRef.current = new Date();
        setState((prev) => ({
          ...prev,
          isListening: true,
          error: null,
        }));

        // Start silence timeout when listening begins
        resetSilenceTimeout();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";
        const results: SpeechToTextResult[] = [];

        // Reset silence timeout when speech is detected
        resetSilenceTimeout();

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          results.push({
            transcript,
            confidence,
            isFinal: result.isFinal,
            timestamp: new Date(),
          });

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setState((prev) => {
          // Update transcript ref for onAutoStop callback
          transcriptRef.current = {
            final: prev.finalTranscript + finalTranscript,
            interim: interimTranscript,
          };

          return {
            ...prev,
            transcript: finalTranscript + interimTranscript,
            interimTranscript,
            finalTranscript: prev.finalTranscript + finalTranscript,
            results: [...prev.results, ...results],
          };
        });
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage =
          "An unknown error occurred during speech recognition";

        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech was detected";
            break;
          case "audio-capture":
            errorMessage = "Audio capture failed";
            break;
          case "not-allowed":
            errorMessage = "Permission to use microphone was denied";
            break;
          case "network":
            errorMessage = "Network error occurred";
            break;
          case "service-not-allowed":
            errorMessage = "Speech recognition service is not allowed";
            break;
          case "bad-grammar":
            errorMessage = "Grammar compilation failed";
            break;
          case "language-not-supported":
            errorMessage = "Language is not supported";
            break;
          case "aborted":
            errorMessage = "Speech recognition was aborted";
            break;
        }

        setState((prev) => ({
          ...prev,
          isListening: false,
          error: {
            code: event.error.toUpperCase().replace("-", "_"),
            message: errorMessage,
            name: "SpeechRecognitionError",
          },
        }));
      };

      recognition.onend = () => {
        // Clear silence timeout when recognition ends
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        setState((prev) => ({
          ...prev,
          isListening: false,
        }));
      };

      setState((prev) => ({
        ...prev,
        isSupported: true,
        isInitializing: false,
      }));

      return recognition;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        isInitializing: false,
        error: {
          code: "INITIALIZATION_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to initialize speech recognition",
          name: "InitializationError",
        },
      }));
      return null;
    }
  }, [
    getBrowserSpeechRecognition,
    checkBrowserCompatibility,
    resetSilenceTimeout,
  ]);

  /**
   * Starts listening for speech input.
   * If the browser is not supported, it sets an error state.
   */
  const startListening = useCallback(
    (options?: Partial<SpeechToTextOptions>) => {
      if (!state.isSupported) {
        const browserCheck = checkBrowserCompatibility();
        setState((prev) => ({
          ...prev,
          error: {
            code: "NOT_SUPPORTED",
            message: "Speech recognition is not supported",
            name: "NotSupportedError",
            browserInfo: {
              browserName: browserCheck.browserName,
              reason: browserCheck.reason,
            },
          },
        }));
        return;
      }

      if (state.isListening) {
        return; // Already listening
      }

      // Update options if provided
      if (options) {
        optionsRef.current = { ...optionsRef.current, ...options };
      }

      // Initialize or reinitialize if needed
      if (!recognitionRef.current) {
        recognitionRef.current = initializeSpeechRecognition();
      }

      if (!recognitionRef.current) {
        return; // Failed to initialize
      }

      try {
        // Apply updated options
        recognitionRef.current.continuous =
          optionsRef.current.continuous ?? true;
        recognitionRef.current.interimResults =
          optionsRef.current.interimResults ?? true;
        recognitionRef.current.maxAlternatives =
          optionsRef.current.maxAlternatives ?? 1;
        recognitionRef.current.lang = optionsRef.current.language ?? "en-US";

        recognitionRef.current.start();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: {
            code: "START_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Failed to start speech recognition",
            name: "StartError",
          },
        }));
      }
    },
    [
      state.isSupported,
      state.isListening,
      initializeSpeechRecognition,
      checkBrowserCompatibility,
    ]
  );

  /**
   * Stops listening for speech input.
   * Clears the silence timeout if it exists.
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      // Clear silence timeout when manually stopping
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  /**
   * Aborts the current speech recognition session.
   * Clears the silence timeout if it exists.
   */
  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      // Clear silence timeout when aborting
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      recognitionRef.current.abort();
    }
  }, []);

  /**
   * Resets the transcript and results.
   * Clears the interim and final transcripts.
   */
  const resetTranscript = useCallback(() => {
    // Reset transcript ref
    transcriptRef.current = { final: "", interim: "" };

    setState((prev) => ({
      ...prev,
      transcript: "",
      interimTranscript: "",
      finalTranscript: "",
      results: [],
    }));
  }, []);

  /**
   * Clears the current error state.
   * Sets the error to null.
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    recognitionRef.current = initializeSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      // Clear silence timeout on cleanup
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };
  }, [initializeSpeechRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      // Clear silence timeout on unmount
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    // State
    ...state,

    // Actions
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
    clearError,
  };
};
