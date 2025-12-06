import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InputSection } from './components/InputSection'; 
import { ExplanationSection } from './components/ExplanationSection';
import { VisualSection } from './components/VisualSection';
import { VerifySection } from './components/VerifySection';
import { SimulationSection } from './components/SimulationSection';
import { Sidebar } from './components/Sidebar';
import { AppTab, GroundingSource, ChatSession, ChatMessage } from './types';
import { generateExplanation, generateVisual, verifyText, generateSimulation, editVisual, editSimulation } from './services/geminiService';
import { BookOpen, Image as ImageIcon, Search, Gamepad2, Moon, Sun, Menu, MoreVertical } from 'lucide-react';

const App: React.FC = () => {
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Layout State for Resizing
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  // App State
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.EXPLANATION);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Processing States
  const [isExplaining, setIsExplaining] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Data States (Specific to current turn)
  const [explanation, setExplanation] = useState('');
  const [visualBase64, setVisualBase64] = useState<string | null>(null);
  const [simulationCode, setSimulationCode] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<{ explanation: string; sources: GroundingSource[] } | null>(null);

  // Initial Load
  useEffect(() => {
    const initialSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);

    // Responsive Sidebar default
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Resizing Logic
  const startResizingLeft = useCallback(() => {
    isResizingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const startResizingRight = useCallback(() => {
    isResizingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingLeft.current = false;
    isResizingRight.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingLeft.current) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 480) {
        setSidebarWidth(newWidth);
      }
    } else if (isResizingRight.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setRightPanelWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    resetOutputs();
  };

  const deleteSession = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id && newSessions.length > 0) {
      setCurrentSessionId(newSessions[0].id);
      resetOutputs();
    } else if (newSessions.length === 0) {
      createNewSession();
    }
  };

  const renameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const resetOutputs = () => {
    setExplanation('');
    setVisualBase64(null);
    setSimulationCode(null);
    setVerificationData(null);
  };

  const updateCurrentSessionMessages = (newMessages: ChatMessage[]) => {
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: newMessages } : s
    ));
  };

  const addBotMessage = (text: string, currentMsgs: ChatMessage[]) => {
     const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: Date.now()
      };
      updateCurrentSessionMessages([...currentMsgs, aiMsg]);
  };

  const handleSendMessage = async (text: string) => {
    const session = getCurrentSession();
    if (!session) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };
    
    let updatedMessages = [...session.messages, userMsg];
    updateCurrentSessionMessages(updatedMessages);

    // Update Title if it's the first message
    if (session.messages.length === 0) {
      const newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
      renameSession(session.id, newTitle);
    }

    // 2. Determine Action based on Tab Context ("Chat to Change")
    // If user is on Visuals Tab and we have an image -> Edit Image
    if (activeTab === AppTab.VISUALS && visualBase64) {
        setIsVisualizing(true);
        try {
            const newImage = await editVisual(visualBase64, text);
            setVisualBase64(newImage);
            addBotMessage("I've updated the infographic based on your request.", updatedMessages);
        } catch (e) {
            addBotMessage("Sorry, I couldn't edit the image.", updatedMessages);
        } finally {
            setIsVisualizing(false);
        }
        return;
    }

    // If user is on Simulation Tab and we have code -> Edit Simulation
    if (activeTab === AppTab.SIMULATION && simulationCode) {
        setIsSimulating(true);
        try {
            const newCode = await editSimulation(simulationCode, text);
            setSimulationCode(newCode);
            addBotMessage("I've updated the simulation with your changes.", updatedMessages);
        } catch (e) {
            addBotMessage("Sorry, I couldn't update the simulation.", updatedMessages);
        } finally {
            setIsSimulating(false);
        }
        return;
    }

    // Default: New Query -> Reset and Generate All
    resetOutputs();
    setActiveTab(AppTab.EXPLANATION); // Switch to explanation initially

    setIsExplaining(true);
    setIsVisualizing(true);
    setIsSimulating(true);

    try {
      const [expResult, visResult, simResult] = await Promise.allSettled([
        generateExplanation(text),
        generateVisual(text),
        generateSimulation(text)
      ]);

      let botResponse = "";

      // Handle Explanation
      if (expResult.status === 'fulfilled') {
        setExplanation(expResult.value);
        botResponse += "I've analyzed that for you. Check the 'Explain' tab for details.\n";
      } else {
        setExplanation("Failed to generate explanation.");
      }
      setIsExplaining(false);

      // Handle Visuals
      if (visResult.status === 'fulfilled') {
        setVisualBase64(visResult.value);
        botResponse += "I also created a visual infographic.\n";
      }
      setIsVisualizing(false);

      // Handle Simulation
      if (simResult.status === 'fulfilled') {
        setSimulationCode(simResult.value);
        botResponse += "And I built a simulation to demonstrate the concept.";
      }
      setIsSimulating(false);

      // Add Final AI Confirmation
      addBotMessage(botResponse || "I processed your request, but something went wrong.", updatedMessages);

    } catch (error) {
      console.error("Processing error", error);
      setIsExplaining(false);
      setIsVisualizing(false);
      setIsSimulating(false);
    }
  };

  const handleVerify = async () => {
    const session = getCurrentSession();
    const lastUserMsg = [...(session?.messages || [])].reverse().find(m => m.role === 'user');
    
    if (!lastUserMsg) return;
    
    setIsVerifying(true);
    try {
      const data = await verifyText(lastUserMsg.text);
      setVerificationData(data);
    } catch (error) {
      alert("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegenerateVisual = async () => {
    const session = getCurrentSession();
    const lastUserMsg = [...(session?.messages || [])].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    setIsVisualizing(true);
    setVisualBase64(null);
    generateVisual(lastUserMsg.text)
        .then(setVisualBase64)
        .catch(e => alert("Failed to regenerate."))
        .finally(() => setIsVisualizing(false));
  };

  const handleRegenerateSimulation = async () => {
    const session = getCurrentSession();
    const lastUserMsg = [...(session?.messages || [])].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    setIsSimulating(true);
    setSimulationCode(null);
    generateSimulation(lastUserMsg.text)
        .then(setSimulationCode)
        .catch(e => alert("Failed to regenerate simulation."))
        .finally(() => setIsSimulating(false));
  };

  const currentSession = getCurrentSession();
  const hasArtifactContext = !!((activeTab === AppTab.VISUALS && visualBase64) || (activeTab === AppTab.SIMULATION && simulationCode));

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex flex-col overflow-hidden`}>
      <div className="flex h-full bg-white dark:bg-black font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
        
        {/* LEFT COLUMN: Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen}
          width={sidebarWidth}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            resetOutputs(); 
          }}
          onNewSession={createNewSession}
          onRenameSession={renameSession}
          onDeleteSession={deleteSession}
        />

        {/* LEFT RESIZER (Desktop Only) */}
        {isSidebarOpen && (
          <div
            className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-400 cursor-col-resize hidden lg:block z-10 transition-colors"
            onMouseDown={startResizingLeft}
          />
        )}

        {/* MIDDLE COLUMN: Main Chat */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-gray-900 relative">
             
             {/* Header */}
             <header className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Clarify<span className="text-blue-500">AI</span></h1>
                </div>
                <div className="flex items-center gap-2">
                   {/* Mobile Right Panel Toggle could go here if needed, but tabs act as toggle */}
                  <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  >
                      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
            </header>

            <InputSection 
                messages={currentSession?.messages || []}
                onSendMessage={handleSendMessage}
                isProcessing={isExplaining || isVisualizing || isSimulating}
                activeTab={activeTab}
                hasArtifactContext={hasArtifactContext}
            />
        </div>

        {/* RIGHT RESIZER (Desktop Only) */}
        <div
          className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-400 cursor-col-resize hidden lg:block z-10 transition-colors"
          onMouseDown={startResizingRight}
        />

        {/* RIGHT COLUMN: Workspace (Tabs) */}
        <div 
            style={{ width: window.innerWidth >= 1024 ? rightPanelWidth : '100%' }}
            className={`
                flex flex-col bg-gray-50 dark:bg-gray-900 h-full border-l border-gray-200 dark:border-gray-800 shadow-xl lg:shadow-none 
                absolute lg:relative right-0 z-20 transform transition-transform duration-300
                ${/* Simple mobile logic: always available but can be toggled via layout if we had a button, currently tabs serve as view */ ''}
                translate-x-full lg:translate-x-0
                ${/* For now on mobile we might just hide it off screen unless we want a toggle? 
                   But prompt says "make chat interface small". 
                   Let's stick to the 3-col layout for desktop dragging. */ ''}
            `}
        >
             
             <div className="flex items-center px-4 pt-2 gap-1 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto no-scrollbar">
                  {[
                    { id: AppTab.EXPLANATION, icon: BookOpen, label: "Explain", color: "blue" },
                    { id: AppTab.VISUALS, icon: ImageIcon, label: "Visuals", color: "purple" },
                    { id: AppTab.SIMULATION, icon: Gamepad2, label: "Sim", color: "indigo" },
                    { id: AppTab.VERIFY, icon: Search, label: "Verify", color: "green" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex-1 justify-center ${
                        activeTab === tab.id 
                          ? `border-${tab.color}-500 text-${tab.color}-600 dark:text-${tab.color}-400 bg-${tab.color}-50/50 dark:bg-${tab.color}-900/10` 
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === AppTab.EXPLANATION && (
                <ExplanationSection explanation={explanation} isLoading={isExplaining} />
                )}
                {activeTab === AppTab.VISUALS && (
                <VisualSection 
                    imageBase64={visualBase64} 
                    isLoading={isVisualizing} 
                    regenerate={handleRegenerateVisual}
                />
                )}
                {activeTab === AppTab.SIMULATION && (
                <SimulationSection 
                    simulationCode={simulationCode}
                    isLoading={isSimulating}
                    regenerate={handleRegenerateSimulation}
                />
                )}
                {activeTab === AppTab.VERIFY && (
                <VerifySection 
                    data={verificationData} 
                    isLoading={isVerifying} 
                    onVerify={handleVerify}
                    hasInput={!!(currentSession?.messages.length)}
                />
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;