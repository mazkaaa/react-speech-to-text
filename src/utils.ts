// Get list of browsers that support Web Speech API
const getSupportedBrowsers = () => {
  return [
    {
      name: "Google Chrome",
      versions: "25+",
      support: "Full support",
      notes: "Best compatibility and performance",
    },
    {
      name: "Microsoft Edge",
      versions: "79+",
      support: "Full support",
      notes: "Chromium-based Edge has full support",
    },
    {
      name: "Safari",
      versions: "14.1+ (macOS), 14.5+ (iOS)",
      support: "Full support",
      notes: "Requires user interaction to start",
    },
    {
      name: "Samsung Internet",
      versions: "6.2+",
      support: "Full support",
      notes: "Mobile browser with good support",
    },
    {
      name: "Opera",
      versions: "27+",
      support: "Partial support",
      notes: "Limited features compared to Chrome",
    },
  ];
};

// Get list of browsers that don't support Web Speech API
const getUnsupportedBrowsers = () => {
  return [
    {
      name: "Brave Browser",
      reason: "Disabled for privacy reasons",
      alternative: "Use Chrome or Edge",
    },
    {
      name: "Firefox",
      reason: "No Web Speech API support",
      alternative: "Use Chrome, Edge, or Safari",
    },
    {
      name: "Internet Explorer",
      reason: "Legacy browser, no support",
      alternative: "Upgrade to modern browser",
    },
    {
      name: "Older Safari",
      reason: "Requires Safari 14.1+ (macOS) or 14.5+ (iOS)",
      alternative: "Update Safari or use Chrome",
    },
  ];
};

export { getSupportedBrowsers, getUnsupportedBrowsers };
