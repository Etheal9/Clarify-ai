
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mic, 
  Square, 
  Send, 
  Brain, 
  Sparkles, 
  Globe, 
  Volume2, 
  VolumeX,
  PlayCircle
} from 'lucide-react';
import { getMetricCoaching } from '../services/geminiService';
import { LanguagePreference } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface MetricAICoachProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: any[];
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const MetricAICoach: React.FC<MetricAICoachProps> = ({ isOpen, onClose, metrics }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to your Cognitive Lab. I've analyzed your performance. Ask me about your brain's progress or for scientific games to power up your learning!" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lang, setLang] = useState<LanguagePreference>('en');
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = lang === 'en' ? 'en-US' : 'am-ET';
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
        }
        if (transcript) setInputText(prev => prev + transcript + ' ');
      };
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const { text: aiResponse, audioBase64 } = await getMetricCoaching(metrics, text, lang);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
      
      if (audioBase64 && isTTSEnabled) {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const bytes = decodeBase64(audioBase64);
        const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMic = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-black border-l-2 border-gray-100 dark:border-gray-900 shadow-2xl z-[150] flex flex-col"
        >
          {/* Header */}
          <header className="p-6 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-950">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500 rounded-xl">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-black dark:text-white leading-none">Cognitive Lab AI</h3>
                   <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Scientific Learning Coach</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => setLang(l => l === 'en' ? 'am' : 'en')} className="p-2 text-gray-400 hover:text-black dark:hover:text-white">
                  <Globe className="w-4 h-4" />
                </button>
                <button onClick={() => setIsTTSEnabled(!isTTSEnabled)} className="p-2 text-gray-400 hover:text-black dark:hover:text-white">
                  {isTTSEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>
          </header>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
             {messages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold leading-relaxed ${m.role === 'user' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800'}`}>
                    {m.text}
                  </div>
               </div>
             ))}
             {isProcessing && (
               <div className="flex justify-start">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl animate-pulse flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-indigo-500" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Thinking Scientist...</span>
                  </div>
               </div>
             )}
             <div ref={chatEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="px-6 py-2 overflow-x-auto no-scrollbar flex gap-2 shrink-0">
             {[
               { en: "Give me a brain game", am: "የአእምሮ ጨዋታ ስጠኝ" },
               { en: "How to fix Direct Recall?", am: "መረጃን የማስታወስ ችሎታዬን እንዴት ላሻሽል?" },
               { en: "What is Feynman Technique?", am: "የፌይንማን ቴክኒክ ምንድነው?" }
             ].map((p, i) => (
               <button 
                key={i} 
                onClick={() => handleSend(lang === 'en' ? p.en : p.am)}
                className="whitespace-nowrap px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
               >
                 {lang === 'en' ? p.en : p.am}
               </button>
             ))}
          </div>

          {/* Input area */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-900 shrink-0">
             <div className="relative group">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(inputText))}
                  placeholder={isRecording ? "Listening..." : "Ask your AI Coach..."}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-6 pr-24 text-sm font-bold outline-none transition-all shadow-inner resize-none h-14 no-scrollbar"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <button 
                    onClick={toggleMic}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-black shadow-sm'}`}
                   >
                     {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                   </button>
                   <button 
                    onClick={() => handleSend(inputText)}
                    disabled={!inputText.trim() || isProcessing}
                    className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-20 transition-all"
                   >
                     <Send className="w-4 h-4" />
                   </button>
                </div>
             </div>
             <p className="text-center text-[8px] font-black text-gray-400 uppercase tracking-widest mt-3 leading-none italic">
                {lang === 'am' ? 'ሳይንሳዊ ትምህርት በምርምር የተደገፈ' : 'SCIENTIFIC LEARNING BACKED BY COGNITIVE RESEARCH'}
             </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
