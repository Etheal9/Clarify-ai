import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { InputSection } from './components/InputSection';
import { ExplanationSection } from './components/ExplanationSection';
import { VisualSection } from './components/VisualSection';
import { SimulationSection } from './components/SimulationSection';
import { VerifySection } from './components/VerifySection';
import { TestSection } from './components/TestSection';
import { TeachSection } from './components/TeachSection';
import { PasteLinkSection } from './components/PasteLinkSection';
import { MetricsSection } from './components/MetricsSection';
import { AppTab, MainView, ChatSession, ChatMessage, GroundingSource, SourceItem, MistakeItem, QuizResult } from './types';
import { generateExplanation, generateVisual, verifyText, generateSimulation, editVisual, editSimulation } from './services/geminiService';

const App: React.FC = () => {
  // --- STATE ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  
  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<MainView>('learning');
  const [activeSubTab, setActiveSubTab] = useState<AppTab>(AppTab.EXPLANATION);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // AI Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [visualBase64, setVisualBase64] = useState<string | null>(null);
  const [simulationCode, setSimulationCode] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<{ explanation: string; sources: GroundingSource[] } | null>(null);

  // Context & Sources
  const [lastContext, setLastContext] = useState<string>('');
  const [sources, setSources] = useState<SourceItem[]>([
      { id: '1', type: 'youtube', title: 'Introduction to Thermodynamics', metadata: 'youtube.com • 15 mins • Uploaded 2h ago', isSelected: true, content: 'Video Transcript Placeholder' },
      { id: '2', type: 'pdf', title: 'Chapter 4: Entropy & Heat.pdf', metadata: 'Local File • 2.4 MB', isSelected: true, content: 'PDF Text Placeholder' },
  ]);

  // Mistakes & Quiz History
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initialSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Thermodynamics Study',
      messages: [],
      createdAt: Date.now()
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
    setLastContext("Thermodynamics basic laws and entropy"); 
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
        else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- HANDLERS ---
  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);
  
  const updateCurrentSessionMessages = (newMessages: ChatMessage[]) => {
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: newMessages } : s));
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Session',
        messages: [],
        createdAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    resetOutputs();
    setActiveView('learning');
    setLastContext('');
  };

  const resetOutputs = () => {
    setExplanation('');
    setVisualBase64(null);
    setSimulationCode(null);
    setVerificationData(null);
  };

  const handleSendMessage = async (text: string) => {
    const session = getCurrentSession();
    if (!session) return;

    setLastContext(text); 

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    let updatedMessages = [...session.messages, userMsg];
    updateCurrentSessionMessages(updatedMessages);

    if (session.messages.length === 0) {
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: text.slice(0, 30) } : s));
    }

    setIsProcessing(true);
    try {
        // --- CONTEXT PREPARATION ---
        // Combine user text with selected sources
        const activeSources = sources.filter(s => s.isSelected);
        let fullContext = text;
        if (activeSources.length > 0) {
             const sourceText = activeSources.map(s => `[Source: ${s.title}]\n${s.content || s.url}`).join('\n\n');
             fullContext = `Reference Material:\n${sourceText}\n\nUser Query/Topic:\n${text}`;
        }
        // ---------------------------

        if (activeView === 'learning' && activeSubTab === AppTab.VISUALS && visualBase64) {
            const newImage = await editVisual(visualBase64, text);
            setVisualBase64(newImage);
        }
        else if (activeView === 'learning' && activeSubTab === AppTab.SIMULATION && simulationCode) {
            const newCode = await editSimulation(simulationCode, text);
            setSimulationCode(newCode);
        }
        else {
            setActiveView('learning');
            setActiveSubTab(AppTab.EXPLANATION);
            
            const [exp, vis, sim, ver] = await Promise.allSettled([
                generateExplanation(fullContext),
                generateVisual(fullContext),
                generateSimulation(fullContext),
                verifyText(fullContext)
            ]);

            if (exp.status === 'fulfilled') setExplanation(exp.value);
            if (vis.status === 'fulfilled') setVisualBase64(vis.value);
            if (sim.status === 'fulfilled') setSimulationCode(sim.value);
            if (ver.status === 'fulfilled') setVerificationData(ver.value);
        }
    } catch (e) {
        console.error("AI Error:", e);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAddSource = (item: SourceItem) => {
      setSources(prev => [item, ...prev]);
  };
  const handleToggleSource = (id: string) => {
      setSources(prev => prev.map(s => s.id === id ? { ...s, isSelected: !s.isSelected } : s));
  };
  const handleDeleteSource = (id: string) => {
      setSources(prev => prev.filter(s => s.id !== id));
  };
  const handleDeleteSelected = () => {
      setSources(prev => prev.filter(s => !s.isSelected));
  };

  const handleAddMistake = (mistake: MistakeItem) => {
      setMistakes(prev => [mistake, ...prev]);
  };
  const handleUpdateMistake = (id: string, note: string) => {
      setMistakes(prev => prev.map(m => m.id === id ? { ...m, note } : m));
  };
  const handleDeleteMistake = (id: string) => {
      setMistakes(prev => prev.filter(m => m.id !== id));
  };
  
  const handleQuizComplete = (result: QuizResult) => {
      setQuizHistory(prev => [result, ...prev]);
      setActiveView('metrics'); // Redirect to metrics to see updated data
  };


  const renderSubNav = () => (
    <div className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-0 flex items-center justify-center gap-4 sm:gap-8 shadow-[inset_0_-1px_0_#f3f4f6] dark:shadow-[inset_0_-1px_0_#262626] transition-all overflow-x-auto">
        {[
            { id: AppTab.EXPLANATION, icon: 'ph-article', label: 'Explanation' },
            { id: AppTab.VISUALS, icon: 'ph-eye', label: 'Visualizing' },
            { id: AppTab.SIMULATION, icon: 'ph-flask', label: 'Simulation' },
            { id: AppTab.VERIFY, icon: 'ph-shield-check', label: 'Verification' }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`
                    text-sm font-medium py-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap
                    ${activeSubTab === tab.id 
                        ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 font-semibold' 
                        : 'text-gray-500 dark:text-gray-500 hover:text-black dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-700'}
                `}
            >
                <i className={`ph ${tab.icon} text-lg`}></i>
                {tab.label}
            </button>
        ))}
    </div>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex text-gray-800 dark:text-gray-100 overflow-hidden font-sans`}>
        <Sidebar 
            isOpen={isSidebarOpen}
            activeView={activeView}
            onViewChange={setActiveView}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => { setCurrentSessionId(id); resetOutputs(); }}
            onNewSession={createNewSession}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 flex flex-col relative bg-white dark:bg-black transition-colors duration-200 min-w-0">
            <header className="h-16 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 sm:px-8 bg-white dark:bg-black z-10 shrink-0">
                <div className="font-bold text-xl tracking-tight flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-6 h-6 bg-black dark:bg-white rounded-md"></div>
                    <span>Clarify AI</span>
                </div>

                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg overflow-x-auto max-w-[200px] sm:max-w-none">
                    {[
                        { id: 'learning', icon: 'ph-book-open-text', label: 'Learning' },
                        { id: 'test', icon: 'ph-check-circle', label: 'Test' },
                        { id: 'teach', icon: 'ph-chalkboard-teacher', label: 'Teach' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as MainView)}
                            className={`
                                px-3 sm:px-4 py-1.5 font-medium rounded-md text-sm flex items-center gap-2 transition-all whitespace-nowrap
                                ${activeView === tab.id 
                                    ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}
                            `}
                        >
                            <i className={`ph ${tab.icon}`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400"
                >
                    {isDarkMode ? <i className="ph ph-sun text-xl"></i> : <i className="ph ph-moon text-xl"></i>}
                </button>
            </header>

            {activeView === 'learning' && renderSubNav()}

            <div className="flex-1 overflow-y-auto relative pb-32 scroll-smooth bg-gray-50/50 dark:bg-[#0a0a0a]">
                
                {activeView === 'learning' && (
                    <div className="h-full flex flex-col max-w-5xl mx-auto w-full pt-6 px-4 sm:px-8">
                        {!explanation && !isProcessing && (
                            <div className="w-full mb-8 animate-fade-in">
                                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 text-indigo-100 dark:text-indigo-900/20"><i className="ph ph-sparkle-fill text-9xl transform rotate-12"></i></div>
                                    <div className="flex items-center gap-4 relative z-10 mb-4 sm:mb-0">
                                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-50 dark:border-indigo-900"><i className="ph ph-sparkle-fill text-2xl"></i></div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">Gemini Insight <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">New</span></h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Start by asking a question or uploading a PDF below.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[400px]">
                            {activeSubTab === AppTab.EXPLANATION && <ExplanationSection explanation={explanation} isLoading={isProcessing && !explanation} />}
                            {activeSubTab === AppTab.VISUALS && (
                                <VisualSection 
                                    imageBase64={visualBase64} 
                                    isLoading={isProcessing && !visualBase64} 
                                    regenerate={() => { /* logic */ }}
                                />
                            )}
                            {activeSubTab === AppTab.SIMULATION && (
                                <SimulationSection 
                                    simulationCode={simulationCode}
                                    isLoading={isProcessing && !simulationCode}
                                    regenerate={() => { /* logic */ }}
                                />
                            )}
                            {activeSubTab === AppTab.VERIFY && (
                                <VerifySection 
                                    data={verificationData}
                                    isLoading={isProcessing && !verificationData}
                                    onVerify={() => { /* logic */ }}
                                    hasInput={true}
                                />
                            )}
                        </div>
                    </div>
                )}

                {activeView === 'test' && (
                   <TestSection 
                        contextText={lastContext} 
                        mistakes={mistakes}
                        onAddMistake={handleAddMistake}
                        onUpdateMistake={handleUpdateMistake}
                        onDeleteMistake={handleDeleteMistake}
                        onQuizComplete={handleQuizComplete}
                   />
                )}

                {activeView === 'teach' && (
                    <TeachSection initialTopic={lastContext.slice(0, 50)} />
                )}

                {activeView === 'paste-link' && (
                    <PasteLinkSection 
                        sources={sources}
                        onAddSource={handleAddSource}
                        onToggleSource={handleToggleSource}
                        onDeleteSource={handleDeleteSource}
                        onDeleteSelected={handleDeleteSelected}
                    />
                )}
                
                {activeView === 'metrics' && (
                     <MetricsSection 
                        mistakes={mistakes}
                        quizHistory={quizHistory}
                     />
                )}
            </div>
            
            {(activeView !== 'teach' && activeView !== 'paste-link') && (
                <InputSection 
                    onSendMessage={handleSendMessage}
                    isProcessing={isProcessing}
                />
            )}

        </main>
    </div>
  );
};

export default App;