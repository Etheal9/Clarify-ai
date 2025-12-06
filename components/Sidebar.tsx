import React from 'react';
import { ChatSession, MainView } from '../types';

interface SidebarProps {
  isOpen: boolean;
  activeView: MainView;
  onViewChange: (view: MainView) => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeView,
  onViewChange,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  toggleSidebar
}) => {
  
  const renderButton = (view: MainView, iconClass: string, label: string) => (
    <button 
      onClick={() => onViewChange(view)}
      className={`w-full sidebar-btn flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group text-left overflow-hidden ${
        activeView === view 
          ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white'
      }`}
      title={label}
    >
      <i className={`ph ${iconClass} text-xl flex-shrink-0 ${activeView === view ? 'text-black dark:text-white' : 'group-hover:text-black dark:group-hover:text-white'}`}></i>
      <span className={`sidebar-label transition-opacity duration-200 whitespace-nowrap ${!isOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 
          flex flex-col justify-between p-4 flex-shrink-0 
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0 lg:w-20'}
        `}
      >
        <div className="space-y-6">
            {/* Toggle Button */}
            <div className={`px-2 flex ${isOpen ? 'justify-start' : 'justify-center'}`}>
                <button onClick={toggleSidebar} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500 dark:text-gray-400">
                    <i className="ph ph-sidebar-simple text-2xl"></i>
                </button>
            </div>

            {/* New Session Button */}
            <button 
                onClick={onNewSession} 
                className={`
                   w-full flex items-center bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold transition-all shadow-lg shadow-gray-200 dark:shadow-none overflow-hidden
                   ${isOpen ? 'px-4 py-3 gap-3' : 'p-3 justify-center'}
                `}
                title="New Session"
            >
                <i className="ph ph-plus text-lg flex-shrink-0"></i>
                {isOpen && (
                   <>
                    <span className="sidebar-label transition-opacity duration-200">New Session</span>
                    <i className="ph ph-sparkle ml-auto text-yellow-300"></i>
                   </>
                )}
            </button>

            {/* Sidebar Navigation */}
            <nav className="space-y-1">
                {renderButton('paste-link', 'ph-link', 'Paste Link')}
                {renderButton('metrics', 'ph-chart-bar', 'Metrics')}
                {renderButton('projects', 'ph-folder', 'Projects')}
                
                {/* History Section - Adapted for Sessions */}
                <div className="pt-4">
                  {isOpen && <div className="px-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Recent</div>}
                  {sessions.slice(0, 5).map(session => (
                      <button
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors overflow-hidden ${
                          currentSessionId === session.id 
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                        }`}
                        title={session.title}
                      >
                         <i className="ph ph-clock-counter-clockwise text-lg flex-shrink-0"></i>
                         <span className={`truncate transition-opacity duration-200 ${!isOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                           {session.title}
                         </span>
                      </button>
                  ))}
                </div>
            </nav>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
            {renderButton('settings', 'ph-gear', 'Settings')}
            
            <div className={`flex items-center gap-3 px-4 py-2 mt-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg overflow-hidden ${!isOpen ? 'justify-center px-0' : ''}`}>
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex-shrink-0"></div>
                {isOpen && <div className="text-sm font-medium text-gray-700 dark:text-gray-200">User Profile</div>}
            </div>
        </div>
      </aside>
    </>
  );
};