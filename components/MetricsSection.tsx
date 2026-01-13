
import React, { useMemo, useState } from 'react';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  Info, 
  Lightbulb,
  Zap,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { MistakeItem, QuizResult } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MetricAICoach } from './MetricAICoach';

interface Metric {
  id: number;
  label: string;
  simpleLabel: string;
  score: number; // 1-5
  required: number; 
  kidFriendlyDesc: string;
  howToImprove: string;
  source: string;
  category: 'Core' | 'Advanced' | 'Performance';
  definition: string;
}

interface MetricsSectionProps {
  mistakes: MistakeItem[];
  quizHistory: QuizResult[];
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({ mistakes, quizHistory }) => {
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const metrics = useMemo<Metric[]>(() => {
    const totalQuizzes = quizHistory.length;
    const accuracy = totalQuizzes > 0 ? (quizHistory.reduce((acc, q) => acc + q.score, 0) / quizHistory.reduce((acc, q) => acc + q.totalQuestions, 0)) : 0;
    
    let baseScore = Math.max(1, Math.min(5, Math.floor(accuracy * 5 + 1)));
    if (totalQuizzes === 0) baseScore = 2;

    return [
      { 
        id: 1, 
        label: 'Direct Recall', 
        simpleLabel: 'The Memory Game',
        score: baseScore, 
        required: 4, 
        category: 'Core', 
        source: 'Fact Quizzes',
        definition: "Ability to retrieve specific facts without cues.",
        kidFriendlyDesc: "This is how well you remember names, dates, and 'what' things are without any help!",
        howToImprove: "Try making more notes in your Insight Notebook or re-reading the 'Definitions' in the Deep Knowledge Loop."
      },
      { 
        id: 2, 
        label: 'Conceptual Understanding', 
        simpleLabel: 'The "Why" Power',
        score: Math.max(1, mistakes.filter(m => m.category === 'Concept Error').length > 1 ? baseScore - 1 : baseScore), 
        required: 4, 
        category: 'Core', 
        source: 'Quiz Explanations',
        definition: "Grasping the underlying principles and relationships.",
        kidFriendlyDesc: "Do you know WHY things happen? This measures if you truly get the big idea.",
        howToImprove: "Go back to the 'Simple Idea' section in your Explanation tab. It explains it like you're 12!"
      },
      { 
        id: 3, 
        label: 'Procedural Mastery', 
        simpleLabel: 'The Step-Taker',
        score: baseScore, 
        required: 4, 
        category: 'Core', 
        source: 'Matching Quizzes',
        definition: "Executing steps or methods correctly.",
        kidFriendlyDesc: "This is about following the rules and doing things in the right order.",
        howToImprove: "Look at the 'Step-by-Step Logic' list. Practice doing those steps in your head."
      },
      { 
        id: 4, 
        label: 'Application', 
        simpleLabel: 'The Real-World Test',
        score: quizHistory.some(q => q.difficulty === 'Hard') ? baseScore : Math.min(baseScore, 2), 
        required: 4, 
        category: 'Core', 
        source: 'Hard Questions',
        definition: "Using knowledge in new, unfamiliar situations.",
        kidFriendlyDesc: "Can you use what you learned to solve a brand new problem you've never seen before?",
        howToImprove: "Try the 'Interactive Simulation'. It lets you play with the concept in a real sandbox!"
      },
      { 
        id: 5, 
        label: 'Critical Thinking', 
        simpleLabel: 'The Truth Finder',
        score: mistakes.length > 0 ? 3 : 2, 
        required: 3, 
        category: 'Advanced', 
        source: 'Mistake Analysis',
        definition: "Evaluating arguments and identifying biases.",
        kidFriendlyDesc: "How good are you at spotting mistakes and knowing what is true and what is a trick?",
        howToImprove: "Read the 'Common Misconceptions' section. It shows you the tricks your brain might play on you."
      },
      { 
        id: 6, 
        label: 'Synthesis', 
        simpleLabel: 'The Dot Connector',
        score: baseScore > 3 ? 4 : 2, 
        required: 3, 
        category: 'Advanced', 
        source: 'Summary Review',
        definition: "Integrating separate elements into a coherent whole.",
        kidFriendlyDesc: "This is your brain's ability to take two different ideas and glue them together.",
        howToImprove: "Read the 'Visual Analogy'. It compares this concept to something else you already know."
      },
      { 
        id: 7, 
        label: 'Error Correction', 
        simpleLabel: 'The Self-Fixer',
        score: mistakes.filter(m => m.note.length > 5).length > 0 ? 4 : 2, 
        required: 4, 
        category: 'Core', 
        source: 'Mistake Notebook',
        definition: "Ability to self-identify and fix mistakes.",
        kidFriendlyDesc: "When you make a mistake, can you figure out why and fix it? This is the most important skill!",
        howToImprove: "Go to your 'Mistake Notebook' and write a better note for your last wrong answer."
      }
    ];
  }, [quizHistory, mistakes]);

  const blindSpots = useMemo(() => metrics.filter(m => m.score < m.required), [metrics]);
  const overallScore = (metrics.reduce((acc, curr) => acc + curr.score, 0) / metrics.length).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black overflow-y-auto custom-scrollbar p-6 sm:p-10 animate-fade-in relative">
      
      {/* 1. OVERALL STATS & BLIND SPOT ANALYSIS */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Main Score Header */}
        <div className="lg:col-span-8 bg-gray-50 dark:bg-gray-950 rounded-[3rem] p-10 border-2 border-gray-100 dark:border-gray-900 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <Brain className="w-4 h-4" /> Cognitive Map
              </div>
              <button 
                onClick={() => setIsCoachOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                <Sparkles className="w-4 h-4" /> AI Insight Coach
              </button>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-black dark:text-white leading-[0.9] mb-4">
              Visualizing <br/> Your Metrics
            </h1>
            <p className="text-gray-500 font-bold max-w-md text-sm">
              We've analyzed your performance across 10 cognitive dimensions. Here is your current mental standing.
            </p>
          </div>
          
          <div className="flex items-center gap-12 mt-10">
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Total Rank</div>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {parseFloat(overallScore) >= 4 ? '👑 Master' : parseFloat(overallScore) >= 3 ? '🚀 Expert' : '🐣 Beginner'}
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-800"></div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Average Power</div>
              <div className="text-4xl font-black text-black dark:text-white">{overallScore}<span className="text-lg opacity-20">/5.0</span></div>
            </div>
          </div>
        </div>

        {/* Blind Spot Analysis Card */}
        <div className="lg:col-span-4 bg-red-50 dark:bg-red-950/20 rounded-[3rem] p-8 border-2 border-red-100 dark:border-red-900/30 flex flex-col">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-6">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-widest">Blind Spot Analysis</h3>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
            {blindSpots.length > 0 ? (
              blindSpots.map(m => (
                <div key={m.id} className="bg-white/80 dark:bg-black/50 p-4 rounded-2xl border border-red-100 dark:border-red-900/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-[11px] text-red-600 dark:text-red-400 uppercase tracking-tight">{m.label}</h4>
                      <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Req: {m.required} • {m.category}</p>
                    </div>
                    <div className="text-lg font-black text-red-600">{m.score}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-8">
                <CheckCircle className="w-10 h-10 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Blind Spots</p>
              </div>
            )}
          </div>
          
          <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest mt-6 text-center">
            {blindSpots.length} areas below threshold
          </p>
        </div>
      </div>

      {/* 2. DETAILED METRICS LIST WITH VISUAL PROGRESS */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
        
        {/* Left: Progress Bars */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex justify-between px-6 mb-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Metric Breakdown</span>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current / Required</span>
          </div>
          {metrics.map((m) => (
            <motion.button
              key={m.id}
              onClick={() => setSelectedMetric(m)}
              whileHover={{ x: 5 }}
              className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all flex flex-col gap-4 group
                ${selectedMetric?.id === m.id ? 'border-indigo-500 bg-white dark:bg-gray-950 shadow-xl' : 'border-gray-50 dark:border-gray-900 bg-white dark:bg-black hover:border-gray-200 dark:hover:border-gray-800'}
              `}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${m.category === 'Core' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                    {m.category === 'Core' ? <TrendingUp className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-black text-black dark:text-white uppercase tracking-tighter text-base leading-none group-hover:text-indigo-500 transition-colors">{m.label}</h4>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{m.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className={`text-xl font-black ${m.score < m.required ? 'text-red-500' : 'text-emerald-500'}`}>{m.score}</span>
                   <span className="text-xs font-bold text-gray-300">/ {m.required}</span>
                </div>
              </div>

              {/* Custom Progress Bar */}
              <div className="relative h-2.5 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.score / 5) * 100}%` }}
                  className={`h-full rounded-full ${m.score < m.required ? 'bg-red-400' : 'bg-indigo-500'}`}
                />
                {/* Required Threshold Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-black/20 dark:bg-white/20 z-10"
                  style={{ left: `${(m.required / 5) * 100}%` }}
                  title={`Required: ${m.required}`}
                />
              </div>

              <div className="flex justify-between items-center px-1">
                 <p className="text-[10px] font-bold text-gray-400 italic truncate max-w-[250px]">{m.definition}</p>
                 <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Right: Improvement & Detail Panel */}
        <div className="lg:col-span-5">
           <div className="sticky top-10 min-h-[500px] bg-gray-50 dark:bg-gray-950 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800 p-10 flex flex-col">
              <AnimatePresence mode="wait">
                {selectedMetric ? (
                  <motion.div
                    key={selectedMetric.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="mb-8">
                       <div className="w-14 h-14 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg mb-6 border border-gray-100 dark:border-gray-900">
                          <Brain className={`w-7 h-7 ${selectedMetric.score < selectedMetric.required ? 'text-red-500' : 'text-indigo-500'}`} />
                       </div>
                       <h3 className="text-3xl font-black tracking-tighter text-black dark:text-white uppercase mb-2">
                          {selectedMetric.simpleLabel}
                       </h3>
                       <div className="flex items-center gap-3 mb-8">
                          <span className="text-[10px] font-black bg-indigo-500 text-white px-3 py-1 rounded-full uppercase tracking-[0.1em]">
                            Score: {selectedMetric.score}/5
                          </span>
                          <span className="text-[10px] font-black border border-gray-200 dark:border-gray-800 text-gray-500 px-3 py-1 rounded-full uppercase tracking-[0.1em]">
                            Threshold: {selectedMetric.required}
                          </span>
                       </div>

                       <div className="space-y-8">
                          <div className="p-6 bg-white dark:bg-black rounded-[2rem] border border-gray-100 dark:border-gray-900 shadow-sm">
                             <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Understanding
                             </h5>
                             <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                {selectedMetric.kidFriendlyDesc}
                             </p>
                          </div>

                          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/30">
                             <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-2">
                                <Lightbulb className="w-3 h-3" /> Growth Guide
                             </h5>
                             <p className="text-sm font-black text-indigo-900 dark:text-indigo-200 leading-relaxed italic">
                                "{selectedMetric.howToImprove}"
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-indigo-600" />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          Data Source: {selectedMetric.source}
                       </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-30">
                    <Target className="w-12 h-12 mb-4" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Select a Metric</h4>
                    <p className="text-xs font-bold mt-2 max-w-[200px]">Click any dimension on the left to see your growth path.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      <MetricAICoach 
        isOpen={isCoachOpen} 
        onClose={() => setIsCoachOpen(false)} 
        metrics={metrics}
      />
    </div>
  );
};
