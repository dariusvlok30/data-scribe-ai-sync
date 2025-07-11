
import React, { useState, useEffect } from 'react';
import { Plus, Search, Settings, X, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentChatTitle?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle, currentChatTitle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Load chat history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setChatHistory(history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save current chat to history when title changes
  useEffect(() => {
    if (currentChatTitle && currentChatTitle.trim()) {
      const newChat: ChatHistory = {
        id: Date.now().toString(),
        title: currentChatTitle,
        timestamp: new Date(),
        messageCount: 1
      };

      setChatHistory(prev => {
        const updated = [newChat, ...prev.slice(0, 19)]; // Keep only 20 most recent
        localStorage.setItem('chatHistory', JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentChatTitle]);

  const handleNewChat = () => {
    window.location.reload(); // Simple way to start new chat
    onToggle();
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
    toast({
      title: "Chat history cleared",
      description: "All chat history has been removed."
    });
  };

  const deleteChatItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => {
      const updated = prev.filter(chat => chat.id !== id);
      localStorage.setItem('chatHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredHistory = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-background/95 backdrop-blur-md border-r border-border transition-transform duration-300 ease-in-out z-50
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      w-80
    `}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold gradient-text">Chat History</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <Button 
          className="w-full mb-3 bg-primary hover:bg-primary/90 rounded-lg"
          onClick={handleNewChat}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border rounded-lg"
          />
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
        <div className="p-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-sm font-medium mb-2">No conversations yet</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Start a new conversation to see your chat history here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    // In a real app, this would load the specific chat
                    console.log('Load chat:', chat.id);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                      <h4 className="text-sm font-medium truncate">{chat.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {chat.timestamp.toLocaleDateString()} • {chat.messageCount} messages
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => deleteChatItem(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {showSettings ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Settings</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettings(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={clearChatHistory}
                className="w-full text-xs"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Clear Chat History
              </Button>
              <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                <p><strong>Ollama:</strong> 10.51.0.15:11434</p>
                <p><strong>Model:</strong> qwen2.5:7b</p>
                <p><strong>Database:</strong> bi_sync_data@10.51.0.11</p>
              </div>
            </div>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full rounded-lg"
            onClick={handleSettings}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
