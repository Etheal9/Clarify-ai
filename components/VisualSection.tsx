
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCcw, 
  MessageSquare, 
  Info, 
  ArrowLeftRight, 
  GitFork, 
  Layout, 
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import { Button } from './Button';
import { VisualType } from '../types';

interface VisualSectionProps {
  imageBase64: string | null;
  isLoading: boolean;
  onRegenerate: (type: VisualType) => void;
  topic?: string;
}

export const VisualSection: React.FC<VisualSectionProps> = ({ 
  imageBase64, 
  isLoading,
  onRegenerate,
  topic
}) => {
  const [view, setView] = useState<'picker' | 'result'>(imageBase64 ? 'result' : 'picker');
  const [selectedType, setSelectedType] = useState<VisualType | null>(null);

  const options: { id: VisualType; icon: React.ReactNode; need: string; visual: string; color: string; description: string }[] = [
    { 
      id: 'diagram', 
      icon: <Layout className="w-6 h-6" />, 
      need: "What is this?", 
      visual: "Diagram", 
      color: "blue",
      description: "Break down the structure and parts of the concept with clear labels."
    },
    { 
      id: 'flow', 
      icon: <GitFork className="w-6 h-6" />, 
      need: "How does it work?", 
      visual: "Flow", 
      color: "emerald",
      description: "Map out the process, steps, and movement of logic."
    },
    { 
      id: 'compare', 
      icon: <ArrowLeftRight className="w-6 h-6" />, 
      need: "Why is this different?", 
      visual: "Compare", 
      color: "amber",
      description: "Contrast key elements side-by-side to highlight distinct features."
    },
    { 
      id: 'analogy', 
      icon: <Lightbulb className="w-6 h-6" />, 
      need: "I don’t get it", 
      visual: "Analogy", 
      color: "purple",
      description: "Visualize a relatable metaphor to unlock core understanding."
    }
  ];

  const handleSelect = (type: VisualType) => {
    setSelectedType(type);
    onRegenerate(type);
    setView('result');
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-black transition-colors">
        <div className="relative">
          <Sparkles className="w-16 h-16 text-indigo-500 animate-pulse mb-8" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-0 border-4 border-dashed border-indigo-200 dark:border-indigo-900 rounded-full scale-150 opacity-20"
          />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Synthesizing Visuals</h3>
        <p className="max-w-xs mt-4 text-sm font-medium text-gray-500">
          Gemini is rendering a custom <span className="text-indigo-600 font-black">{selectedType || 'infographic'}</span> based on your cognitive needs.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black transition-colors overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'picker' ? (
          <motion.div 
            key="picker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar"
          >
            <div className="max-w-4xl mx-auto space-y-12">
              <header className="text-center space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Visual Intelligence</span>
                <h2 className="text-4xl font-black tracking-tighter text-black dark:text-white leading-none">Choose Your Lens</h2>
                <p className="text-gray-400 font-bold text-sm">Select the visual format that best matches your current learning roadblock.</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className="group relative flex flex-col items-start p-8 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-900 bg-white dark:bg-[#080808] hover:border-black dark:hover:border-white hover:shadow-2xl hover:-translate-y-1 transition-all text-left"
                  >
                    <div className={`p-4 rounded-2xl bg-${opt.color}-50 dark:bg-${opt.color}-900/20 text-${opt.color}-600 mb-6 group-hover:scale-110 transition-transform`}>
                      {opt.icon}
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{opt.need}</span>
                       <h4 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">{opt.visual}</h4>
                       <p className="text-xs font-medium text-gray-500 leading-relaxed">{opt.description}</p>
                    </div>
                    <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Sparkles className={`w-5 h-5 text-${opt.color}-400`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* Minimal Sub-header */}
            <div className="h-14 px-6 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between shrink-0">
               <button 
                  onClick={() => setView('picker')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Selector
               </button>
               <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">
                    {selectedType || 'Visual'} Style
                  </span>
                  <button onClick={() => selectedType && onRegenerate(selectedType)} className="p-2 text-gray-400 hover:text-black dark:hover:text-white">
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </button>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-8 bg-gray-50/50 dark:bg-[#050505] flex items-center justify-center">
              {imageBase64 ? (
                <div className="relative group max-w-4xl w-full">
                  <img 
                    src={imageBase64} 
                    alt="Generated Explanation" 
                    className="w-full h-auto object-contain rounded-[3rem] shadow-2xl border-4 border-white dark:border-gray-900"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem] flex items-center justify-center backdrop-blur-sm">
                    <Button onClick={() => setView('picker')} variant="secondary" className="bg-white text-black font-black uppercase tracking-widest px-8">Change Style</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                   <Info className="w-12 h-12 text-gray-300 mx-auto" />
                   <p className="text-gray-400 font-medium">Visual could not be rendered. Try another style.</p>
                   <Button onClick={() => setView('picker')} variant="ghost">Return to Picker</Button>
                </div>
              )}
            </div>

            {/* Social Prompting Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-black text-center shrink-0">
              <div className="flex items-center justify-center gap-3 text-indigo-500 font-black uppercase tracking-[0.2em] text-[10px]">
                  <MessageSquare className="w-4 h-4" />
                  WANT TO MODIFY THIS?
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">Use the main chat below. Try: "Add more labels", "Make it blue", or "Include coffee examples".</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
