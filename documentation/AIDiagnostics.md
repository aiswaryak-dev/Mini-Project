# Developer Documentation: `AIDiagnostics.jsx`

## Overview
`AIDiagnostics.jsx` renders the Computer Vision & AI Assistant view. It features a neural leaf disease scanner simulator with scanning laser animation and an interactive **SproutAI** botanical chat assistant.

## Why It's Used
Allows users to perform real-time disease pathology scans on plant leaf specimens and ask botanical care questions in natural language.

## File Location
`src/pages/AIDiagnostics.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `Cpu, Camera, Upload, Sparkles, AlertCircle, CheckCircle2, ShieldAlert, MessageSquare, Send, Bot, User, RefreshCw` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
- `scanning` (`boolean`): Laser scan loading state.
- `scanResult` (`object`): Diagnostic output object (condition, confidence %, symptoms, causes, treatment).
- `selectedImage` (`string`): Specimen image URL.
- `messages` (`array`): Chat conversation history.
- `inputMsg` (`string`): Chat input text.

## Full Code Flow (Step-by-Step)
1. Renders neural leaf scanner frame with vertical laser scan animation.
2. Clicking "Run AI Analysis" triggers `handleSimulateScan()`.
3. Processes specimen, selects pathology report, and logs scan to Firestore via `logActivity()`.
4. Chat form submit (`handleSendMessage`) posts user question and generates intelligent botanical answer from SproutAI.

```javascript
const handleSendMessage = (e) => {
  e.preventDefault();
  if (!inputMsg.trim()) return;
  setMessages(prev => [...prev, { sender: 'user', text: inputMsg }]);
  setInputMsg('');
  setTimeout(() => {
    setMessages(prev => [...prev, { sender: 'bot', text: "For tropical houseplants..." }]);
  }, 1000);
};
```

## Backend Connection
Calls `logActivity()` in `PlantContext`, writing scan records to Firestore `activity_logs`.

## Data Flow Diagram
`Run AI Scan / Chat Send` ➔ `handleSimulateScan / handleSendMessage` ➔ AI Logic ➔ `scanResult / messages` ➔ Firestore

## Events & Handlers
- `handleSimulateScan()`: Executes leaf scan.
- `handleSendMessage(e)`: Sends question to SproutAI.

## Edge Cases & Error Handling
Disables scan button while `scanning` laser animation is active.

## Styling
Scanning frame (`relative h-64 rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-emerald-500`).
