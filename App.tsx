
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
import { FloatingNotebook } from './components/FloatingNotebook';
import { AppTab, MainView, ChatSession, ChatMessage, GroundingSource, SourceItem, MistakeItem, QuizResult, VisualType, LanguagePreference } from './types';
import { generateExplanation, generateVisual, verifyText, generateSimulation } from './services/geminiService';
import { Globe, Languages } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<MainView>('learning');
  const [activeSubTab, setActiveSubTab] = useState<AppTab>(AppTab.EXPLANATION);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<LanguagePreference>('en');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [isSimLoading, setIsSimLoading] = useState(false);
  
  const [explanation, setExplanation] = useState<any>(null);
  const [visualBase64, setVisualBase64] = useState<string | null>(null);
  const [simulationCode, setSimulationCode] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<{ explanation: string; sources: GroundingSource[] } | null>(null);

  const [lastContext, setLastContext] = useState<string>('');
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);

  useEffect(() => {
    const initialSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Study Session',
      messages: [],
      createdAt: Date.now()
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);
  }, []);

  const handleSendMessage = async (text: string) => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    setLastContext(text); 

    setIsProcessing(true);
    try {
        const activeSources = sources.filter(s => s.isSelected);
        let fullContext = text;
        if (activeSources.length > 0) {
             const sourceText = activeSources.map(s => `[Source: ${s.title}]\n${s.content || s.url}`).join('\n\n');
             fullContext = `Reference Material:\n${sourceText}\n\nUser Query/Topic:\n${text}`;
        }

        setActiveView('learning');
        setActiveSubTab(AppTab.EXPLANATION);
        
        const [exp, ver] = await Promise.allSettled([
            generateExplanation(fullContext, language),
            verifyText(fullContext)
        ]);
        
        if (exp.status === 'fulfilled') setExplanation(exp.value);
        if (ver.status === 'fulfilled') setVerificationData(ver.value);
    } catch (e) {
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRegenerateVisual = async (type: VisualType) => {
      setIsVisualLoading(true);
      try {
          const res = await generateVisual(lastContext, type);
          setVisualBase64(res);
      } catch (e) {
          console.error(e);
      } finally {
          setIsVisualLoading(false);
      }
  };

  const handleUpdateSimulation = async (prompt: string) => {
    setIsSimLoading(true);
    try {
        const res = await generateSimulation(prompt, language, simulationCode || undefined);
        setSimulationCode(res);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSimLoading(false);
    }
  };

  const onAddSource = (s: SourceItem) => setSources([...sources, s]);
  const onToggleSource = (id: string) => setSources(sources.map(s => s.id === id ? {...s, isSelected: !s.isSelected} : s));
  const onDeleteSource = (id: string) => setSources(sources.filter(s => s.id !== id));
  const onDeleteSelected = () => setSources(sources.filter(s => !s.isSelected));

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex text-black dark:text-white overflow-hidden font-sans`}>
        <Sidebar 
            isOpen={isSidebarOpen}
            activeView={activeView}
            onViewChange={setActiveView}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onNewSession={() => {}}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 flex flex-col relative bg-white dark:bg-black min-w-0">
            <header className="h-20 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-black">
                <div className="font-black text-2xl tracking-tighter flex items-center gap-2 uppercase">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <span className="text-white dark:text-black text-[12px]">C</span>
                    </div>
                    <span className="hidden sm:inline">Clarify AI</span>
                </div>

                <div className="flex space-x-2 bg-gray-100 dark:bg-gray-950 p-1.5 rounded-2xl">
                    {['learning', 'test', 'teach'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveView(tab as MainView)}
                            className={`px-5 py-2.5 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all ${activeView === tab ? 'bg-white dark:bg-gray-800 shadow-xl' : 'text-gray-400 hover:text-black'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Language Selector */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-950 p-1 rounded-full border border-gray-200 dark:border-gray-800">
                        {[
                            { id: 'en', label: 'EN' },
                            { id: 'am', label: 'አማ' },
                            { id: 'both', label: 'Both' }
                        ].map((l) => (
                            <button
                                key={l.id}
                                onClick={() => setLanguage(l.id as LanguagePreference)}
                                className={`px-2 sm:px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded-full transition-all ${language === l.id ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                        {isDarkMode ? <i className="ph ph-sun text-xl"></i> : <i className="ph ph-moon text-xl"></i>}
                    </button>
                </div>
            </header>

            {activeView === 'learning' && (
              <div className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 flex items-center justify-center gap-4 sm:gap-8 shrink-0 overflow-x-auto no-scrollbar">
                {[
                  { id: AppTab.EXPLANATION, label: 'Explanation' },
                  { id: AppTab.VISUALS, label: 'Visualizing' },
                  { id: AppTab.SIMULATION, label: 'Simulation' },
                  { id: AppTab.VERIFY, label: 'Verification' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} className={`text-[10px] font-black py-4 border-b-4 transition-all uppercase tracking-widest whitespace-nowrap ${activeSubTab === tab.id ? 'border-black dark:border-white text-black dark:text-white' : 'text-gray-400 border-transparent hover:text-black'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto relative scroll-smooth bg-gray-50/30 dark:bg-black pb-32">
                {activeView === 'learning' && (
                    <div className="h-full max-w-6xl mx-auto w-full pt-8 px-6">
                        <div className="h-full bg-white dark:bg-black rounded-[3rem] shadow-2xl border-4 border-gray-100 dark:border-gray-900 overflow-hidden min-h-[500px]">
                            {activeSubTab === AppTab.EXPLANATION && <ExplanationSection explanation={explanation} isLoading={isProcessing && !explanation} />}
                            {activeSubTab === AppTab.VISUALS && <VisualSection imageBase64={visualBase64} isLoading={isVisualLoading} onRegenerate={handleRegenerateVisual} />}
                            {activeSubTab === AppTab.SIMULATION && <SimulationSection simulationCode={simulationCode} isLoading={isSimLoading} onUpdate={handleUpdateSimulation} />}
                            {activeSubTab === AppTab.VERIFY && <VerifySection data={verificationData} isLoading={isProcessing && !verificationData} onVerify={() => {}} hasInput={!!lastContext} />}
                        </div>
                    </div>
                )}
                {activeView === 'test' && (
                  <TestSection 
                    contextText={lastContext} 
                    mistakes={mistakes} 
                    onAddMistake={(m) => setMistakes([...mistakes, m])} 
                    onUpdateMistake={(id, note) => setMistakes(mistakes.map(m => m.id === id ? {...m, note} : m))} 
                    onDeleteMistake={(id) => setMistakes(mistakes.filter(m => m.id !== id))} 
                    onQuizComplete={(r) => setQuizHistory([...quizHistory, r])} 
                  />
                )}
                {activeView === 'teach' && <TeachSection initialTopic={lastContext.slice(0, 50)} />}
                {activeView === 'paste-link' && (
                  <PasteLinkSection 
                    sources={sources} 
                    onAddSource={onAddSource} 
                    onToggleSource={onToggleSource} 
                    onDeleteSource={onDeleteSource} 
                    onDeleteSelected={onDeleteSelected} 
                  />
                )}
                {activeView === 'metrics' && <MetricsSection mistakes={mistakes} quizHistory={quizHistory} />}
            </div>
            
            {(activeView === 'learning' || activeView === 'test') && <InputSection onSendMessage={handleSendMessage} isProcessing={isProcessing} />}
        </main>

        <FloatingNotebook />
    </div>
  );
};

export default App;
