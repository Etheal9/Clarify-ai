
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, RotateCcw, Send, Sparkles, Wand2 } from 'lucide-react';
import { Button } from './Button';

interface SimulationSectionProps {
  simulationCode: string | null;
  isLoading: boolean;
  onUpdate: (prompt: string) => void;
}

export const SimulationSection: React.FC<SimulationSectionProps> = ({ 
  simulationCode, 
  isLoading,
  onUpdate
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSend = () => {
    if (!prompt.trim() || isLoading) return;
    onUpdate(prompt);
    setPrompt('');
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-black">
        <div className="relative mb-8">
            <Gamepad2 className="w-16 h-16 text-indigo-500 animate-bounce" />
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="absolute inset-0 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-full scale-150 opacity-20"
            />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Coding Logic...</h3>
        <p className="max-w-xs mt-4 text-sm font-medium text-gray-500">Gemini is writing custom HTML/JS to bring your concept to life.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-black transition-colors">
      {/* Header */}
      <div className="h-14 px-6 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#050505]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">Interactive Sandbox</span>
          </div>
          <Button variant="ghost" onClick={() => onUpdate("Restart simulation")} className="h-8 px-3 text-[10px] uppercase font-black" icon={<RotateCcw className="w-3 h-3"/>}>Reset</Button>
      </div>

      {/* Simulation Frame */}
      <div className="flex-1 bg-white relative">
        {simulationCode ? (
          <iframe
              srcDoc={simulationCode}
              title="Generated Simulation"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-popups allow-forms"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
             <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2rem] mb-6">
                <Wand2 className="w-10 h-10" />
             </div>
             <p className="text-sm font-bold max-w-xs">Enter a concept below to generate an interactive simulation from scratch.</p>
          </div>
        )}
      </div>

      {/* Simulation Command Bar */}
      <div className="p-6 border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-black shrink-0">
          <div className="max-w-2xl mx-auto">
              <div className="relative group">
                  <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={simulationCode ? "Modify simulation (e.g. 'Make it faster')" : "Describe concept to simulate..."}
                    className="w-full bg-gray-50 dark:bg-[#0c0c0c] border-2 border-gray-100 dark:border-gray-900 rounded-full py-4 pl-6 pr-14 text-sm font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all shadow-inner"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!prompt.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105"
                  >
                    <Send className="w-4 h-4" />
                  </button>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-3 text-center">
                 {simulationCode ? "Chat to modify logic, visuals, or behavior" : "Generates a complete interactive sandbox for learning"}
              </p>
          </div>
      </div>
    </div>
  );
};
