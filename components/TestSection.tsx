import React, { useState, useEffect } from 'react';
import { QuizData, QuestionType, MatchPair } from '../types';
import { generateQuiz } from '../services/geminiService';
import { Button } from './Button';
import { CheckCircle, AlertCircle, RefreshCcw, Sparkles } from 'lucide-react';

interface TestSectionProps {
  contextText: string;
}

export const TestSection: React.FC<TestSectionProps> = ({ contextText }) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState<QuestionType>('choose');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // State for user answers
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({}); // { leftItem: rightItem }
  const [showResult, setShowResult] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    if (contextText && !quizData && !isLoading) {
      handleGenerateQuiz();
    }
  }, [contextText]);

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    try {
      const data = await generateQuiz(contextText || "General knowledge");
      setQuizData(data);
      setCurrentQuestionIndex(0);
      resetInteraction();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetInteraction = () => {
    setSelectedOption('');
    setTextInput('');
    setMatchSelections({});
    setShowResult(false);
  };

  const handleTypeChange = (type: QuestionType) => {
    setActiveType(type);
    setCurrentQuestionIndex(0);
    resetInteraction();
  };

  const handleNext = () => {
    if (currentQuestionIndex < 4) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetInteraction();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      resetInteraction();
    }
  };

  // --- RENDERERS ---

  const renderChoose = () => {
    if (!quizData) return null;
    const q = quizData.choose[currentQuestionIndex];
    if (!q) return <div>No question data</div>;

    const isCorrect = selectedOption === q.correctAnswer;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => { if(!showResult) setSelectedOption(opt); }}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between
                ${selectedOption === opt 
                  ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                ${showResult && opt === q.correctAnswer ? '!bg-green-100 !border-green-500 text-green-800' : ''}
                ${showResult && selectedOption === opt && opt !== q.correctAnswer ? '!bg-red-50 !border-red-500 text-red-800' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                 <span className="font-bold text-gray-400 text-lg">{String.fromCharCode(65 + idx)}:</span>
                 <span className="font-medium">{opt}</span>
              </div>
              {showResult && opt === q.correctAnswer && <CheckCircle className="text-green-600 w-5 h-5"/>}
              {showResult && selectedOption === opt && opt !== q.correctAnswer && <AlertCircle className="text-red-500 w-5 h-5"/>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderFillBlank = () => {
    if (!quizData) return null;
    const q = quizData.fillBlank[currentQuestionIndex];
    if (!q) return null;

    // Split sentence by "___"
    const parts = q.sentence.split('___');

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">{q.question}</h3>
        <div className="text-2xl font-serif leading-relaxed text-gray-800 dark:text-gray-100">
           {parts[0]}
           <span className="relative inline-block mx-2 min-w-[120px]">
              <input 
                type="text" 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={showResult}
                className={`w-full bg-transparent border-b-2 outline-none text-center font-bold px-2
                   ${showResult 
                      ? (textInput.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim() ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600')
                      : 'border-gray-400 focus:border-black dark:focus:border-white'
                   }
                `}
                placeholder="type answer..."
              />
              {showResult && textInput.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim() && (
                 <div className="absolute top-full left-0 w-full text-xs text-green-600 font-sans mt-1 text-center bg-green-50 px-1 py-0.5 rounded">
                    Ans: {q.correctAnswer}
                 </div>
              )}
           </span>
           {parts[1]}
        </div>
      </div>
    );
  };

  const renderMatch = () => {
    if (!quizData) return null;
    const q = quizData.match[currentQuestionIndex]; // Note: "Match" usually implies a set, but let's treat one "question" as one set of pairs for simplicity
    if (!q) return null;

    // We need to render Left column and Right column
    // For simplicity, let's just show standard html select for right side
    
    // In a real app we'd randomize right side. For this demo, let's just assume pairs come in order and we randomize display
    // But to keep code simple and reliable without complex state management for randomization on every render,
    // we will map over the pairs directly but ask user to select from a dropdown.

    const rightOptions = q.pairs.map(p => p.right).sort(); 

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">{q.question}</h3>
            <div className="grid gap-4">
                {q.pairs.map((pair, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex-1 font-medium text-gray-700 dark:text-gray-200">{pair.left}</div>
                        <div className="text-gray-400"><i className="ph ph-arrows-left-right"></i></div>
                        <div className="flex-1">
                            <select 
                                className={`w-full p-2 rounded-lg border bg-white dark:bg-black outline-none
                                    ${showResult 
                                        ? (matchSelections[pair.left] === pair.right ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700')
                                        : 'border-gray-300 dark:border-gray-600'
                                    }
                                `}
                                value={matchSelections[pair.left] || ''}
                                onChange={(e) => setMatchSelections({...matchSelections, [pair.left]: e.target.value})}
                                disabled={showResult}
                            >
                                <option value="">Select match...</option>
                                {rightOptions.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                            {showResult && matchSelections[pair.left] !== pair.right && (
                                <div className="text-xs text-green-600 mt-1">Correct: {pair.right}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderAnswer = () => {
     if (!quizData) return null;
     const q = quizData.answer[currentQuestionIndex];
     if (!q) return null;

     return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{q.question}</h3>
            <textarea 
                className="w-full h-32 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white outline-none bg-transparent resize-none"
                placeholder="Type your answer here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={showResult}
            />
            {showResult && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4"/> AI Sample Answer
                    </h4>
                    <p className="text-blue-900 dark:text-blue-100 text-sm">{q.sampleAnswer}</p>
                </div>
            )}
        </div>
     );
  };

  // --- MAIN UI ---

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full mb-4"></div>
            <h2 className="text-xl font-bold text-gray-400">Generating Assessment...</h2>
            <p className="text-gray-400 mt-2">Crafting questions from your learning session.</p>
        </div>
    );
  }

  if (!quizData) {
      return (
          <div className="flex flex-col items-center justify-center h-full">
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 text-center max-w-md">
                 <h2 className="text-xl font-bold mb-2">Ready to Test?</h2>
                 <p className="text-gray-500 mb-6">Generate a quiz based on the content you've been learning.</p>
                 <Button onClick={handleGenerateQuiz}>Generate Quiz</Button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center pt-8 px-4 w-full h-full animate-fade-in">
        <div className="max-w-5xl w-full h-full flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Assessment</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Topic: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{quizData.topic}</span></p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleGenerateQuiz} icon={<RefreshCcw className="w-4 h-4"/>}>
                        New Quiz
                    </Button>
                </div>
            </div>
            
            {/* Main Card Layout */}
            <div className="flex-1 flex gap-6 min-h-0 mb-20"> {/* mb-20 for bottom input bar clearance */}
                
                {/* Left: Question Area */}
                <div className="flex-1 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.1]" 
                         style={{backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto relative z-10 custom-scrollbar">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Question {currentQuestionIndex + 1}
                                    <span className="text-gray-400 font-medium text-lg ml-1">/ 5</span>
                                </h2>
                                <div className="h-1 w-12 bg-black dark:bg-white mt-2"></div>
                            </div>
                            
                            {/* Difficulty Badges (Visual Only) */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                                <button className="px-3 py-1 text-xs font-bold rounded-md text-gray-500">Easy</button>
                                <button className="px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-gray-700 text-orange-600 shadow-sm">Medium</button>
                                <button className="px-3 py-1 text-xs font-bold rounded-md text-gray-500">Hard</button>
                            </div>
                        </div>

                        {/* Question Content Render */}
                        <div className="animate-fade-in">
                            {activeType === 'choose' && renderChoose()}
                            {activeType === 'fill-blank' && renderFillBlank()}
                            {activeType === 'match' && renderMatch()}
                            {activeType === 'answer' && renderAnswer()}
                        </div>

                    </div>

                    {/* Bottom Controls */}
                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center relative z-10">
                        <div className="flex gap-2">
                             <button 
                                onClick={handlePrevious} 
                                disabled={currentQuestionIndex === 0}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30 transition-colors"
                             >
                                Previous
                             </button>
                             <button 
                                onClick={handleNext}
                                disabled={currentQuestionIndex === 4}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30 transition-colors"
                             >
                                Next
                             </button>
                        </div>
                        
                        {!showResult ? (
                            <button 
                                onClick={() => setShowResult(true)}
                                className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-bold shadow-lg hover:transform hover:scale-105 transition-all"
                            >
                                Check Answer
                            </button>
                        ) : (
                             <div className="flex items-center gap-2 text-green-600 font-bold px-4">
                                <CheckCircle className="w-5 h-5"/> Checked
                             </div>
                        )}
                    </div>
                </div>

                {/* Right: Type Sidebar */}
                <div className="w-64 bg-gray-50 dark:bg-gray-900/30 border-l border-gray-200 dark:border-gray-800 p-6 flex flex-col rounded-r-2xl hidden md:flex shrink-0">
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 text-xs uppercase tracking-wider">Question Type</h3>
                    
                    <div className="space-y-2 relative">
                         {/* Selection Indicator Line (Visual approximation) */}
                         <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

                         {[
                             { id: 'choose', label: 'Choose' },
                             { id: 'fill-blank', label: 'Fill the Blank' },
                             { id: 'match', label: 'Match' },
                             { id: 'answer', label: 'Answer Question' }
                         ].map((type) => (
                             <div 
                                key={type.id}
                                onClick={() => handleTypeChange(type.id as QuestionType)}
                                className="flex items-center gap-3 relative cursor-pointer group py-2"
                             >
                                <div className={`w-4 h-4 rounded-full border-2 transition-colors z-10
                                    ${activeType === type.id 
                                        ? 'bg-black dark:bg-white border-black dark:border-white' 
                                        : 'bg-white dark:bg-black border-gray-300 dark:border-gray-600 group-hover:border-gray-500'}
                                `}></div>
                                <span className={`text-sm font-medium transition-colors
                                     ${activeType === type.id ? 'text-black dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700'}
                                `}>
                                    {type.label}
                                </span>
                             </div>
                         ))}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};