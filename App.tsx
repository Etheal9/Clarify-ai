
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        if (window.innerWidth >= 1024) setIsSidebarOpen(true);
        else setIsSidebarOpen(false);
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
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
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

    setIsProcessing(true);
    try {
        const activeSources = sources.filter(s => s.isSelected);
        let fullContext = text;
        if (activeSources.length > 0) {
             const sourceText = activeSources.map(s => `[Source: ${s.title}]\n${s.content || s.url}`).join('\n\n');
             fullContext = `Reference Material:\n${sourceText}\n\nUser Query/Topic:\n${text}`;
        }

        if (activeView === 'learning' && activeSubTab === AppTab.VISUALS && visualBase64) {
            const newImage = await editVisual(visualBase64, text);
            setVisualBase64(newImage);
        } else if (activeView === 'learning' && activeSubTab === AppTab.SIMULATION && simulationCode) {
            const newCode = await editSimulation(simulationCode, text);
            setSimulationCode(newCode);
        } else {
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderSubNav = () => (
    <div className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-0 flex items-center justify-center gap-4 sm:gap-8 shadow-sm transition-all overflow-x-auto no-scrollbar">
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
                    text-sm font-black py-4 flex items-center gap-2 border-b-4 transition-all whitespace-nowrap uppercase tracking-widest
                    ${activeSubTab === tab.id 
                        ? 'text-black dark:text-white border-black dark:border-white' 
                        : 'text-gray-400 border-transparent hover:text-black dark:hover:text-white'}
                `}
            >
                <i className={`ph ${tab.icon} text-lg`}></i>
                {tab.label}
            </button>
        ))}
    </div>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex text-black dark:text-white overflow-hidden font-sans`}>
        <Sidebar 
            isOpen={isSidebarOpen}
            activeView={activeView}
            onViewChange={(view) => {
                setActiveView(view);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => { 
                setCurrentSessionId(id); 
                resetOutputs(); 
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            onNewSession={createNewSession}
            toggleSidebar={toggleSidebar}
        />

        <main className="flex-1 flex flex-col relative bg-white dark:bg-black transition-colors duration-200 min-w-0">
            <header className="h-20 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-black z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={toggleSidebar} className="p-2 lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-black dark:text-white">
                        <i className="ph ph-list text-3xl"></i>
                    </button>
                    <div className="font-black text-2xl tracking-tighter flex items-center gap-2 text-black dark:text-white uppercase">
                        <div className="w-7 h-7 bg-black dark:bg-white rounded-lg flex-shrink-0"></div>
                        <span className="hidden md:inline">Clarify AI</span>
                    </div>
                </div>

                <div className="flex-1 flex justify-center">
                    <div className="flex space-x-2 bg-gray-100 dark:bg-gray-950 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                        {[
                            { id: 'learning', icon: 'ph-book-open-text', label: 'Learning' },
                            { id: 'test', icon: 'ph-check-circle', label: 'Test' },
                            { id: 'teach', icon: 'ph-chalkboard-teacher', label: 'Teach' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id as MainView)}
                                className={`
                                    px-5 py-2.5 font-black rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap
                                    ${activeView === tab.id 
                                        ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-xl' 
                                        : 'text-gray-400 hover:text-black dark:hover:text-white'}
                                `}
                            >
                                <i className={`ph ${tab.icon} text-lg`}></i>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-900 text-black dark:text-white border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                >
                    {isDarkMode ? <i className="ph ph-sun text-2xl"></i> : <i className="ph ph-moon text-2xl"></i>}
                </button>
            </header>

            {activeView === 'learning' && renderSubNav()}

            <div className={`flex-1 overflow-y-auto relative scroll-smooth bg-gray-50/30 dark:bg-black ${activeView === 'teach' || activeView === 'paste-link' ? 'pb-0' : 'pb-32'}`}>
                {activeView === 'learning' && (
                    <div className="h-full flex flex-col max-w-6xl mx-auto w-full pt-8 px-6">
                        <div className="flex-1 bg-white dark:bg-black rounded-[3rem] shadow-2xl border-4 border-gray-100 dark:border-gray-900 overflow-hidden min-h-[500px]">
                            {activeSubTab === AppTab.EXPLANATION && <ExplanationSection explanation={explanation} isLoading={isProcessing && !explanation} />}
                            {activeSubTab === AppTab.VISUALS && <VisualSection imageBase64={visualBase64} isLoading={isProcessing && !visualBase64} regenerate={() => {}} />}
                            {activeSubTab === AppTab.SIMULATION && <SimulationSection simulationCode={simulationCode} isLoading={isProcessing && !simulationCode} regenerate={() => {}} />}
                            {activeSubTab === AppTab.VERIFY && <VerifySection data={verificationData} isLoading={isProcessing && !verificationData} onVerify={() => {}} hasInput={true} />}
                        </div>
                    </div>
                )}
                {activeView === 'test' && <TestSection contextText={lastContext} mistakes={mistakes} onAddMistake={() => {}} onUpdateMistake={() => {}} onDeleteMistake={() => {}} onQuizComplete={() => {}} />}
                {activeView === 'teach' && <TeachSection initialTopic={lastContext.slice(0, 50)} />}
                {activeView === 'paste-link' && <PasteLinkSection sources={sources} onAddSource={() => {}} onToggleSource={() => {}} onDeleteSource={() => {}} onDeleteSelected={() => {}} />}
                {activeView === 'metrics' && <MetricsSection mistakes={mistakes} quizHistory={quizHistory} />}
            </div>
            
            {(activeView !== 'teach' && activeView !== 'paste-link') && <InputSection onSendMessage={handleSendMessage} isProcessing={isProcessing} />}
        </main>
    </div>
  );
};

export default App;
