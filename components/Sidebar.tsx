import React, { useState } from 'react';
import { Plus, MessageSquare, Edit2, Check, X, Trash2, Menu, X as CloseIcon } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  width: number;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  width,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  toggleSidebar
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveTitle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle);
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      onDeleteSession(id);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-40 bg-black text-gray-100 flex flex-col border-r border-gray-800 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:transition-none
        `}
        style={{ 
          width: window.innerWidth >= 1024 ? width : '280px',
          display: !isOpen && window.innerWidth >= 1024 ? 'none' : 'flex'
        }}
      >
        {/* Header / New Chat */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) toggleSidebar();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>
          
          <button 
            onClick={toggleSidebar}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/50 lg:hidden"
            title="Close Sidebar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            History
          </div>
          <div className="space-y-1 px-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors relative
                  ${currentSessionId === session.id ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-900/50 hover:text-gray-200'}
                `}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                
                {editingId === session.id ? (
                  <div className="flex-1 flex items-center gap-1 min-w-0">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-black text-white text-sm rounded px-1 py-0.5 border border-blue-500 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if(e.key === 'Enter') saveTitle(session.id, e as any);
                        if(e.key === 'Escape') cancelEditing(e as any);
                      }}
                    />
                    <button onClick={(e) => saveTitle(session.id, e)} className="p-1 hover:text-green-400"><Check className="w-3 h-3" /></button>
                    <button onClick={cancelEditing} className="p-1 hover:text-red-400"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm">{session.title}</span>
                    <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-gray-900 pl-2">
                      <button 
                        onClick={(e) => startEditing(session, e)}
                        className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-1.5 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};