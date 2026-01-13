
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Lightbulb, 
  Layers, 
  ShieldAlert, 
  BrainCircuit, 
  ClipboardCheck, 
  ArrowRight, 
  ChevronDown, 
  Eye, 
  Sparkles,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Coffee,
  MapPin
} from 'lucide-react';
import { ExplanationData } from '../types';

interface ExplanationSectionProps {
  explanation: ExplanationData | null;
  isLoading: boolean;
}

export const ExplanationSection: React.FC<ExplanationSectionProps> = ({ explanation, isLoading }) => {
  const [revealedSteps, setRevealedSteps] = useState<number>(1);
  const [recallState, setRecallState] = useState<'idle' | 'revealed'>('idle');
  const [showFormal, setShowFormal] = useState(false);

  useEffect(() => {
    setRevealedSteps(1);
    setRecallState('idle');
    setShowFormal(false);
  }, [explanation]);

  if (isLoading) {
    return (
      <div className="p-12 space-y-8 animate-pulse h-full bg-white dark:bg-black">
        <div className="h-12 bg-gray-100 dark:bg-gray-900 rounded-2xl w-1/3"></div>
        <div className="h-64 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem]"></div>
        <div className="h-32 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem]"></div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
          <BrainCircuit className="w-10 h-10 text-indigo-500" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">Ready to Decode</h3>
        <p className="max-w-xs text-sm text-gray-500 font-medium">Input text or a PDF to trigger a brain-optimized explanation.</p>
      </div>
    );
  }

  const handleNext = () => setRevealedSteps(prev => prev + 1);

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-black custom-scrollbar selection:bg-indigo-100 dark:selection:bg-indigo-900/30 pb-24">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-16">
        
        {/* HEADER */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
             <Sparkles className="w-3 h-3" /> Level Up Your Mind
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-black dark:text-white leading-[0.9]">
            {explanation.topic}
          </h1>
        </header>

        {/* 1. INTUITION FIRST */}
        <Section 
          icon={<Zap className="w-6 h-6 text-amber-500" />}
          label="The Hook"
          title="Intuition First"
          color="amber"
          isVisible={revealedSteps >= 1}
        >
          <div className="space-y-6">
            <h4 className="text-2xl font-black text-amber-900 dark:text-amber-200 leading-tight">
              {explanation.intuition.hook}
            </h4>
            <div className="flex gap-4">
              <div className="flex-shrink-0 pt-1 text-amber-400">
                 <Coffee className="w-5 h-5" />
              </div>
              <p className="text-stone-700 dark:text-stone-300 font-medium text-lg leading-relaxed">
                {explanation.intuition.problem}
              </p>
            </div>
            <div className="p-5 bg-amber-100/30 dark:bg-amber-900/10 rounded-3xl border border-amber-200/50 dark:border-amber-800/30 flex items-start gap-3">
               <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
               <p className="text-sm font-bold text-amber-800 dark:text-amber-400 italic">
                 Local Insight: {explanation.intuition.localContext}
               </p>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-amber-600/60 animate-pulse">
               {explanation.intuition.curiosityGap}
            </p>
          </div>
        </Section>

        {/* 2. SIMPLE IDEA */}
        <Section 
          icon={<Lightbulb className="w-6 h-6 text-sky-500" />}
          label="The Core"
          title="Explain Like I'm 12"
          color="sky"
          isVisible={revealedSteps >= 2}
        >
          <div className="text-2xl font-bold text-sky-900 dark:text-sky-100 leading-snug">
            {explanation.simpleIdea}
          </div>
        </Section>

        {/* 3. ANALOGY */}
        <Section 
          icon={<Layers className="w-6 h-6 text-emerald-500" />}
          label="Mental Model"
          title="Visual Analogy"
          color="emerald"
          isVisible={revealedSteps >= 3}
        >
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border-l-4 border-emerald-500 italic font-bold text-emerald-800 dark:text-emerald-300">
               "{explanation.analogy.comparison}"
            </div>
            <p className="text-lg text-emerald-900 dark:text-emerald-100 leading-relaxed">
              {explanation.analogy.explanation}
            </p>
          </div>
        </Section>

        {/* 4. FORMAL (Progressive Reveal) */}
        <div className={revealedSteps >= 4 ? "block" : "hidden"}>
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Deep Knowledge Loop</span>
              <button 
                onClick={() => setShowFormal(!showFormal)}
                className="group flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {showFormal ? 'Compress Data' : 'Tap to Go Deeper (Exam Prep)'}
                </span>
              </button>
           </div>
           
           <AnimatePresence>
             {showFormal && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.98, y: 10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.98, y: 10 }}
                 className="space-y-6"
               >
                 <div className="bg-gray-50 dark:bg-[#0c0c0c] border border-gray-100 dark:border-gray-900 rounded-[3rem] p-8 sm:p-12 space-y-10 shadow-2xl">
                    <div className="space-y-6">
                      <h5 className="text-xs font-black uppercase tracking-widest text-indigo-500">Standard Definitions</h5>
                      <div className="grid gap-6">
                        {explanation.formal.definitions.map((d, i) => (
                          <div key={i} className="space-y-2">
                             <div className="font-black text-black dark:text-white uppercase tracking-tighter text-lg">{d.term}</div>
                             <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{d.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {explanation.formal.formulas && (
                      <div className="space-y-4">
                        <h5 className="text-xs font-black uppercase tracking-widest text-indigo-500">Formula Breakdown</h5>
                        <div className="grid gap-3">
                          {explanation.formal.formulas.map((f, i) => (
                            <div key={i} className="p-4 bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center gap-2">
                               <div className="font-mono text-2xl text-indigo-600 font-black">{f.formula}</div>
                               <div className="text-[10px] uppercase font-bold text-gray-400">{f.explanation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                       <h5 className="text-xs font-black uppercase tracking-widest text-indigo-500">Step-by-Step Logic</h5>
                       <div className="space-y-4">
                         {explanation.formal.stepByStep.map((step, i) => (
                           <div key={i} className="flex gap-4 group">
                              <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center font-black text-[10px] shrink-0">{i+1}</span>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{step}</p>
                           </div>
                         ))}
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* 5. MISTAKES (CRITICAL) */}
        <Section 
          icon={<ShieldAlert className="w-6 h-6 text-rose-500" />}
          label="The Warning"
          title="Common Misconceptions"
          color="rose"
          isVisible={revealedSteps >= 5}
        >
          <div className="space-y-8">
            <p className="text-sm font-black uppercase tracking-widest text-rose-400 mb-6">Most people lose marks here</p>
            {explanation.mistakes.map((m, i) => (
              <div key={i} className="group space-y-3 bg-white dark:bg-[#121212] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-900 shadow-sm transition-transform hover:-translate-y-1">
                <div className="flex items-start gap-3">
                   <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                   <div className="text-sm font-bold text-gray-400 dark:text-gray-600 line-through decoration-rose-500/20">{m.wrong}</div>
                </div>
                <div className="flex items-start gap-3 pt-2">
                   <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                   <div className="text-sm font-black text-black dark:text-white uppercase tracking-tight">{m.right}</div>
                </div>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 italic pl-8 leading-relaxed">
                   {m.reason}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. ACTIVE RECALL */}
        <Section 
          icon={<BrainCircuit className="w-6 h-6 text-purple-500" />}
          label="Pattern Interrupt"
          title="Active Recall Challenge"
          color="purple"
          isVisible={revealedSteps >= 6}
        >
          <div className="space-y-8">
            <h4 className="text-2xl font-black text-purple-900 dark:text-purple-100 leading-tight">
              {explanation.activeRecall.question}
            </h4>
            
            <div className="flex flex-col items-center py-6">
               <button 
                  onClick={() => setRecallState('revealed')}
                  className={`px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs transition-all
                    ${recallState === 'revealed' ? 'bg-purple-100 text-purple-600 scale-95' : 'bg-purple-600 text-white shadow-xl hover:scale-105 active:scale-95'}
                  `}
               >
                 {recallState === 'revealed' ? 'Answer Revealed' : 'I Have My Answer (Reveal Feedback)'}
               </button>
            </div>

            <AnimatePresence>
               {recallState === 'revealed' && (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                 >
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-[2rem] border border-purple-100 dark:border-purple-800">
                       <label className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-2 block">Ideal Mental Path</label>
                       <p className="text-lg font-bold text-purple-900 dark:text-purple-200">{explanation.activeRecall.answer}</p>
                    </div>
                    <div className="flex gap-3 text-xs font-bold text-purple-400 italic">
                       <RefreshCcw className="w-4 h-4 shrink-0" />
                       Feedback: {explanation.activeRecall.feedback}
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>
        </Section>

        {/* 7. SUMMARY */}
        <Section 
          icon={<ClipboardCheck className="w-6 h-6 text-gray-900 dark:text-white" />}
          label="Compression"
          title="Summary of Concepts"
          color="gray"
          isVisible={revealedSteps >= 7}
        >
          <div className="space-y-4">
            {explanation.summary.map((point, i) => (
              <div key={i} className="flex gap-4 group">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                 <p className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-relaxed group-hover:translate-x-1 transition-transform">{point}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* PROGRESS NAVIGATION */}
        {revealedSteps < 7 && (
          <div className="pt-20 flex flex-col items-center">
             <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-8 flex items-center gap-2">
                <ChevronDown className="w-4 h-4 animate-bounce" />
                Next Layer Unlocking...
             </div>
             <button 
                onClick={handleNext}
                className="group relative px-12 py-6 bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-[0.3em] text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all"
             >
                <span className="flex items-center gap-4">
                   Continue Journey {revealedSteps}/7 <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
             </button>
          </div>
        )}

        {revealedSteps === 7 && (
          <div className="pt-24 text-center">
             <div className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6">
                <Sparkles className="w-5 h-5" /> Cognitive Loop Complete
             </div>
             <p className="text-gray-400 font-bold text-sm max-w-sm mx-auto">Concept encoded. Proceed to visuals or practice simulations to solidify your mastery.</p>
          </div>
        )}

      </div>
    </div>
  );
};

interface SectionProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  color: string;
  children: React.ReactNode;
  isVisible: boolean;
}

const Section: React.FC<SectionProps> = ({ icon, label, title, children, isVisible }) => {
  if (!isVisible) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4">
         <div className="p-4 bg-white dark:bg-[#111] rounded-[1.5rem] shadow-xl border border-gray-100 dark:border-gray-900 flex items-center justify-center">
           {icon}
         </div>
         <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{label}</span>
            <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter leading-none">{title}</h3>
         </div>
      </div>
      <div className="bg-white dark:bg-black transition-colors">
        {children}
      </div>
    </motion.section>
  );
};
