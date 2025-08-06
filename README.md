# React Speech-to-Text

A powerful, TypeScript-first React hook for speech recognition using the Web Speech API. This library provides a simple yet comprehensive interface for converting speech to text in React applications.

[![npm version](https://badge.fury.io/js/@mazka%2Freact-speech-to-text.svg)](https://badge.fury.io/js/@mazka%2Freact-speech-to-text.svg) [![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🎤 **Easy-to-use React hook** for speech recognition
- 🔧 **TypeScript support** with full type definitions
- 🌐 **Browser compatibility detection** with detailed error messages
- ⏱️ **Auto-stop on silence** with customizable duration and callback
- 🎯 **Real-time interim results** for better user experience
- 🔄 **Continuous recognition** support
- 🚨 **Comprehensive error handling** with specific error codes
- 🎨 **Multiple language support**
- 📱 **Cross-platform compatibility** (Chrome, Edge, Safari, Opera)

## Important Note

The Web Speech API implementation varies by browser, with important implications for privacy and functionality:

- ⚠️ **Server-based processing**: On some browsers, such as Chrome, using Speech Recognition involves a server-based recognition engine where your audio is sent to a web service for recognition processing, so it won't work offline
- 🔒 **Chrome/Chromium implementation**: If you are using Chrome or Chromium-based browsers, the Web Speech API recognition feature currently relies on Google's servers
- 🌐 **Internal browser detail**: Chrome (and some other Chromium-based browsers) implement the recognition half of the Web Speech API by sending audio to Google's online speech service unless the user is offline. This is an internal detail of Chrome, not a requirement of the Web Speech API specification
- 📡 **Internet connection required** for most implementations
- 🛡️ **Privacy considerations**: Not all browsers support this API due to privacy and implementation concerns

## Installation

```bash
npm install @mazka/react-speech-to-text
```

```bash
yarn add @mazka/react-speech-to-text
```

```bash
pnpm add @mazka/react-speech-to-text
```

## Quick Start

```tsx
import React from 'react';
import { useSpeechToText } from 'react-speech-to-text';

function App() {
  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  if (!isSupported) {
    return <div>Speech recognition is not supported in your browser.</div>;
  }

  return (
    <div>
      <h1>Speech to Text Demo</h1>
      
      <div>
        <button 
          onClick={startListening} 
          disabled={isListening}
        >
          {isListening ? 'Listening...' : 'Start Listening'}
        </button>
        
        <button 
          onClick={stopListening} 
          disabled={!isListening}
        >
          Stop
        </button>
        
        <button onClick={resetTranscript}>
          Reset
        </button>
      </div>
      
      <div>
        <p><strong>Transcript:</strong> {transcript}</p>
      </div>
    </div>
  );
}

export default App;
```

## API Reference

### `useSpeechToText(options?)`

The main hook that provides speech-to-text functionality.

#### Parameters

- `options` (optional): `Partial<SpeechToTextOptions>` - Configuration options

#### Returns

Returns a `UseSpeechToTextReturn` object with the following properties:

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `isListening` | `boolean` | Whether speech recognition is currently active |
| `isSupported` | `boolean` | Whether speech recognition is supported in the browser |
| `isInitializing` | `boolean` | Whether the speech recognition is initializing |
| `transcript` | `string` | Combined final and interim transcript |
| `interimTranscript` | `string` | Current interim (temporary) transcript |
| `finalTranscript` | `string` | Accumulated final transcript |
| `results` | `SpeechToTextResult[]` | Array of all recognition results |
| `error` | `SpeechToTextStateError \| null` | Current error state |

#### Action Methods

| Method | Type | Description |
|--------|------|-------------|
| `startListening` | `(options?: Partial<SpeechToTextOptions>) => void` | Start speech recognition |
| `stopListening` | `() => void` | Stop speech recognition |
| `abortListening` | `() => void` | Abort speech recognition immediately |
| `resetTranscript` | `() => void` | Clear all transcripts and results |
| `clearError` | `() => void` | Clear the current error state |

## Configuration Options

### `SpeechToTextOptions`

```typescript
interface SpeechToTextOptions {
  continuous?: boolean;           // Default: true
  interimResults?: boolean;       // Default: true
  maxAlternatives?: number;       // Default: 1
  language?: string;              // Default: "en-US"
  autoStopOnSilence?: {
    enabled: boolean;             // Default: false
    silenceDuration?: number;     // Default: 3000 (ms)
    onAutoStop?: (transcript: string) => void; // Callback when auto-stop occurs
  };
}
```

#### Option Details

- **`continuous`**: Whether to continue listening after the user stops speaking
- **`interimResults`**: Whether to return interim results while the user is speaking
- **`maxAlternatives`**: Maximum number of alternative transcripts to return
- **`language`**: Language code for speech recognition (e.g., "en-US", "es-ES", "fr-FR")
- **`autoStopOnSilence`**: Automatically stop listening after a period of silence
  - `enabled`: Enable/disable the feature
  - `silenceDuration`: Duration in milliseconds to wait before stopping
  - `onAutoStop`: Callback function called when auto-stop is triggered

## Advanced Examples

### With Custom Options

```tsx
import { useSpeechToText } from 'react-speech-to-text';

function AdvancedExample() {
  const {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    language: 'en-US',
    autoStopOnSilence: {
      enabled: true,
      silenceDuration: 5000, // 5 seconds
      onAutoStop: (transcript) => {
        console.log('Auto-stopped with transcript:', transcript);
      },
    },
  });

  return (
    <div>
      <button onClick={() => startListening()}>
        Start Listening
      </button>
      
      <button onClick={stopListening}>
        Stop Listening
      </button>
      
      {error && (
        <div style={{ color: 'red' }}>
          Error: {error.message}
        </div>
      )}
      
      <div>
        <p><strong>Final:</strong> {finalTranscript}</p>
        <p><strong>Interim:</strong> {interimTranscript}</p>
        <p><strong>Combined:</strong> {transcript}</p>
      </div>
    </div>
  );
}
```

### Dynamic Language Switching

```tsx
import { useSpeechToText } from 'react-speech-to-text';

function MultiLanguageExample() {
  const { startListening, stopListening, transcript, isListening } = useSpeechToText();

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
  ];

  const handleLanguageChange = (language: string) => {
    if (isListening) {
      stopListening();
    }
    startListening({ language });
  };

  return (
    <div>
      <div>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.name}
          </button>
        ))}
      </div>
      
      <div>
        <p>Transcript: {transcript}</p>
      </div>
    </div>
  );
}
```

### Auto-Stop on Silence with Callback

```tsx
import { useSpeechToText } from 'react-speech-to-text';

function AutoStopExample() {
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    resetTranscript 
  } = useSpeechToText({
    autoStopOnSilence: {
      enabled: true,
      silenceDuration: 2000, // Stop after 2 seconds of silence
      onAutoStop: (finalTranscript) => {
        console.log('Auto-stopped! Final transcript:', finalTranscript);
        // You can perform actions here like saving the transcript
      },
    },
  });

  return (
    <div>
      <h2>Auto-Stop Demo</h2>
      <p>Listening will automatically stop after 2 seconds of silence.</p>
      
      <button onClick={() => startListening()}>
        Start Listening
      </button>
      
      <button onClick={stopListening} disabled={!isListening}>
        Stop Manually
      </button>
      
      <button onClick={resetTranscript}>
        Clear
      </button>
      
      <div>
        <p>Status: {isListening ? 'Listening...' : 'Not listening'}</p>
        <p>Transcript: {transcript}</p>
      </div>
    </div>
  );
}
```

## Browser Compatibility

The Web Speech API has **limited browser support** because it relies on Google's cloud-based speech recognition service. Here's the current support status:

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome** | ✅ Full | Best support, all features available |
| **Edge** | ✅ Full | Full Web Speech API support |
| **Safari** | ✅ Full | iOS 14.5+, macOS Safari 14.1+ |
| **Opera** | ⚠️ Limited | Basic support, some features may be limited |
| **Firefox** | ❌ No | Does not support Web Speech API |
| **Brave** | ❌ No | Disabled for privacy reasons |

> **📖 For detailed browser compatibility information, see the [MDN Web Speech API Browser Compatibility](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/SpeechRecognition#browser_compatibility) page.**

### Why Limited Support?

1. **Privacy Concerns**: Some browsers (like Brave and Firefox) don't support the API due to privacy implications of server-based audio processing or lack of integration to Web Speech API.
2. **Browser Implementation Differences**: Chrome and Chromium-based browsers send audio to Google's servers as an internal implementation detail, while other browsers may handle it differently or not at all
3. **Offline Limitations**: Server-based recognition engines require internet connectivity, making the feature unavailable offline
4. **Vendor Dependencies**: Some browser vendors prefer to avoid dependencies on external speech services

The library automatically detects browser compatibility and provides detailed error messages for unsupported browsers.

## Error Handling

The library provides comprehensive error handling with specific error codes:

```typescript
interface SpeechToTextStateError {
  code: string;
  message: string;
  name: string;
  browserInfo?: {
    browserName: string;
    reason: string;
  };
}
```

### Common Error Codes

- `NOT_SUPPORTED`: Browser doesn't support Web Speech API
- `NOT_ALLOWED`: Microphone permission denied
- `NO_SPEECH`: No speech detected
- `AUDIO_CAPTURE`: Audio capture failed
- `NETWORK`: Network error occurred (server-based recognition requires internet connection)
- `INITIALIZATION_ERROR`: Failed to initialize speech recognition
- `START_ERROR`: Failed to start speech recognition

## Privacy and Security Considerations

⚠️ **Important Privacy Information:**

- **Server-based processing**: In Chrome and Chromium-based browsers, audio is sent to Google's servers for processing as an internal implementation detail
- **No offline support**: Server-based recognition engines require an active internet connection
- **Browser-specific behavior**: Different browsers may implement the Web Speech API differently, with varying privacy implications
- **User awareness**: Always inform users that their audio may be processed by external services (particularly Google's servers in Chrome)
- **Consent mechanisms**: Consider implementing user consent mechanisms before enabling speech recognition
- **Data handling**: Be aware that audio data transmission and processing policies may vary by browser implementation

## TypeScript Support

This library is written in TypeScript and provides full type definitions. All interfaces and types are exported for use in your application:

```typescript
import { 
  useSpeechToText,
  SpeechToTextOptions,
  SpeechToTextResult,
  SpeechToTextState,
  UseSpeechToTextReturn 
} from 'react-speech-to-text';
```

## Requirements

- React 18.0.0 or higher
- Modern browser with Web Speech API support
- Internet connection (required for server-based speech recognition implementations)
- User permission for microphone access

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/mazkaaa/react-speech-to-text/blob/main/LICENSE) file for details.

## Acknowledgments

- Built with the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Chrome implementation utilizes Google's cloud-based speech recognition service
- Inspired by the need for a robust, TypeScript-first speech recognition solution for React

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/mazkaaa/react-speech-to-text/issues) on GitHub.
