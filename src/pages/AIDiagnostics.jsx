import React, { useState } from 'react';
import { Cpu, Camera, Upload, Sparkles, AlertCircle, CheckCircle2, ShieldAlert, MessageSquare, Send, Bot, User, RefreshCw } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

const AI_DIAGNOSTIC_SAMPLE_DISEASES = [
  {
    condition: 'Interveinal Chlorosis (Iron / Magnesium Deficiency)',
    confidence: 94.8,
    status: 'Deficiency',
    severity: 'Moderate',
    symptoms: 'Yellowing of leaf tissue between dark green veins. Lower leaves showing pale tint.',
    causes: 'Imbalanced soil pH (> 7.0) restricting micronutrient absorption, or waterlogged soil.',
    treatment: 'Dose foliar iron chelate spray. Adjust soil pH to 6.2 - 6.5 using organic peat compost.'
  },
  {
    condition: 'Powdery Mildew (Erysiphales Fungal Spores)',
    confidence: 91.2,
    status: 'Fungal Risk',
    severity: 'High',
    symptoms: 'White powdery patches forming on upper leaf cuticle with slight leaf curling.',
    causes: 'High relative humidity combined with stagnant indoor air circulation.',
    treatment: 'Isolate plant. Apply organic neem oil spray or potassium bicarbonate solution twice weekly.'
  },
  {
    condition: 'Sunlight Scorch & Moisture Stress',
    confidence: 97.4,
    status: 'Environmental',
    severity: 'Mild',
    symptoms: 'Crispy brown crispy margins on leaf tips and pale scorched blotches.',
    causes: 'Direct scorching afternoon sun through glass window and irregular watering cycles.',
    treatment: 'Move plant 1.5 meters back from direct window pane into bright indirect light.'
  },
  {
    condition: 'Healthy Botanical Foliage',
    confidence: 99.1,
    status: 'Optimal',
    severity: 'None',
    symptoms: 'Vibrant green chlorophyll density, pristine cuticle luster, firm cell turgidity.',
    causes: 'Optimal lighting and balanced automated moisture delivery.',
    treatment: 'Maintain current smart automated irrigation schedule. Wipe leaves monthly.'
  }
];

export const AIDiagnostics = () => {
  const { logActivity } = usePlants();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(AI_DIAGNOSTIC_SAMPLE_DISEASES[0]);
  const [selectedImage, setSelectedImage] = useState('https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=600');

  // AI Chat Assistant State
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm SproutAI 🌿, your AI Botanical Care Assistant. Ask me anything about plant diagnostics, soil mix recipes, or watering schedules!"
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      // Pick random diagnosis result
      const randomIdx = Math.floor(Math.random() * AI_DIAGNOSTIC_SAMPLE_DISEASES.length);
      const res = AI_DIAGNOSTIC_SAMPLE_DISEASES[randomIdx];
      setScanResult(res);
      setScanning(false);

      logActivity({
        type: 'ai',
        title: 'AI Leaf Health Scan Executed',
        plantName: 'Scanned Foliage',
        timestamp: new Date().toISOString(),
        details: `Diagnosed: ${res.condition} (${res.confidence}% confidence)`
      });
    }, 2200);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');

    // Generate intelligent AI botanical response
    setTimeout(() => {
      let botReply = "That's a great question! For optimal growth, maintain soil moisture between 40%-70% and ensure well-draining soil with perlite. Let me know if you need specific fertilizer recommendations.";
      
      const lower = userText.toLowerCase();
      if (lower.includes('water') || lower.includes('moisture')) {
        botReply = "For most tropical houseplants, wait until the top 2 inches of soil feel dry to touch. Our automated irrigation system triggers whenever moisture drops below your calibrated threshold!";
      } else if (lower.includes('yellow') || lower.includes('leaves')) {
        botReply = "Yellowing leaves often indicate overwatering or Nitrogen/Iron deficiency. Check your sensor moisture meter; if moisture is > 80%, allow the pot to drain thoroughly.";
      } else if (lower.includes('sun') || lower.includes('light')) {
        botReply = "Bright indirect sunlight (500 - 900 lux) is ideal for Monsteras, Ficus, and Pothos. Avoid harsh midday direct sunlight to prevent leaf tip scorch.";
      } else if (lower.includes('bug') || lower.includes('pest') || lower.includes('mite')) {
        botReply = "For indoor plant pests, wipe down leaves with a diluted solution of organic neem oil and mild insecticidal soap every 5 days for 3 cycles.";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-2">
          <Cpu className="w-3.5 h-3.5" /> Computer Vision & AI Assistant
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Botanical Health Diagnostics</h2>
        <p className="text-xs text-slate-500">Scan plant leaves for instant disease detection, pest analysis, and botanical advice</p>
      </div>

      {/* Main Grid: Scanner & AI Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Leaf Scanner Simulator */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              Leaf Disease Neural Scanner
            </h3>
            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              MODEL: VisionNet-Plant-v4
            </span>
          </div>

          {/* Scanner Dropzone Frame */}
          <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-emerald-500/50 group">
            <img 
              src={selectedImage} 
              alt="Scan specimen"
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30"></div>

            {/* Scanning Laser Animation Overlay */}
            {scanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[scan_2s_infinite] top-0"></div>
            )}

            {/* Overlays */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs">
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 font-medium">
                {scanning ? 'Neural Processing...' : 'Specimen Loaded'}
              </span>
              <button
                onClick={handleSimulateScan}
                disabled={scanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                <span>{scanning ? 'Scanning...' : 'Run AI Analysis'}</span>
              </button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-emerald-200 text-xs font-medium drop-shadow-sm">
                Click "Run AI Analysis" to process leaf pathology via deep learning
              </p>
            </div>
          </div>

          {/* Diagnosis Results Breakdown Card */}
          {scanResult && !scanning && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Diagnostic Report</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {scanResult.confidence}% Match
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  {scanResult.condition}
                </h4>
                <p className="text-xs text-slate-600 mt-1">{scanResult.symptoms}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60">
                  <span className="font-bold text-amber-900 block mb-0.5">Probable Cause:</span>
                  <span className="text-amber-800 leading-tight block text-[11px]">{scanResult.causes}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60">
                  <span className="font-bold text-emerald-900 block mb-0.5">Recommended Remedy:</span>
                  <span className="text-emerald-800 leading-tight block text-[11px]">{scanResult.treatment}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Interactive SproutAI Assistant Chat */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft flex flex-col h-[560px]">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-emerald-950 text-white rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">SproutAI Assistant</h3>
                <span className="text-[11px] text-emerald-300 font-medium">Botanical LLM • Active</span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-800 text-emerald-200 border border-emerald-700">
              NLP 2.0
            </span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs shrink-0 font-bold">
                    AI
                  </div>
                )}

                <div className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-none font-medium shadow-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-soft'
                }`}>
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white rounded-b-3xl flex items-center gap-2">
            <input 
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask SproutAI about care, soil recipes, disease symptoms..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
