import { useState, FormEvent } from 'react';
import { X, Sparkles, Send, Bot, User as UserIcon, Shirt, Ruler } from 'lucide-react';

interface AiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiConciergeModal({ isOpen, onClose }: AiConciergeModalProps) {
  const [prompt, setPrompt] = useState('');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Salam! I am Jersey AI Concierge. I can help you pick the exact right jersey size based on your height and weight, recommend match kits, or guide you on custom squad printing!'
    }
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && !height) return;

    const userText = prompt.trim() || `What jersey size should I buy for height ${height}cm and weight ${weight}kg?`;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          userHeight: height,
          userWeight: weight
        })
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: 'I am here to help! For Bangladesh National Team and European Player Versions, size L fits height 172-180cm perfectly.'
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Player Version jerseys have a snug athletic slim fit. We recommend ordering 1 size larger if you prefer loose style!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const presetQueries = [
    'Which size for 175cm & 70kg?',
    'What is difference between Player Version & Fan Version?',
    'How do I order custom name & number printing?',
    'Recommend a gift jersey for my friend'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col h-[620px] border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-white">
                JERSEY AI CONCIERGE
                <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
                  GEMINI 2.5
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">Personal Stylist & Size Advisor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Size Calculator Widget */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 px-5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Ruler className="w-4 h-4 text-emerald-600" />
            <span>Size Recommendation Engine:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Height (cm)"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-medium focus:outline-hidden text-xs"
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-medium focus:outline-hidden text-xs"
            />
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-100/60">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[85%] ${
                m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {m.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 font-medium">
                Jersey AI is thinking...
              </div>
            </div>
          )}
        </div>

        {/* Preset Chips */}
        <div className="p-3 bg-white border-t border-slate-200 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
          {presetQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(q);
              }}
              className="whitespace-nowrap bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3 py-1.5 rounded-full transition-colors cursor-pointer shrink-0 border border-slate-200"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Form Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            placeholder="Ask Jersey AI for recommendations, sizing or match kit info..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-400 text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
