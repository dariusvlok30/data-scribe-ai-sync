
import React, { useState } from 'react';
import { Menu, Brain, Database, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from './ChatInterface';
import ChatSidebar from './ChatSidebar';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatTitle, setChatTitle] = useState<string>('');

  const handleNewMessage = (message: string) => {
    // Generate chat title from first message if not set
    if (!chatTitle && message.trim()) {
      const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
      setChatTitle(title);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <ChatSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentChatTitle={chatTitle}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Navigation - Always visible with sidebar button */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 floating-animation">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">DataScribe AI</h1>
                <p className="text-sm text-muted-foreground">Database Assistant</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">AI Ready</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400">Database Ready</span>
            </div>
          </div>
        </header>

        {/* Chat Interface - Takes remaining space with proper overflow handling */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface onNewMessage={handleNewMessage} />
        </div>

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-4 py-2 border-t border-border bg-background/95 backdrop-blur-md text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>Ollama qwen2.5:7b</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-400" />
              <span>bi_sync_data @ 10.51.0.11</span>
            </div>
          </div>
          
          <div className="hidden sm:block">
            <span>Ready • Press Enter to send • Drop files to upload</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
