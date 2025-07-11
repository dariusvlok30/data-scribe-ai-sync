
import React, { useState } from 'react';
import { MessageSquare, Plus, Search, Trash2, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Product Data Import',
      lastMessage: 'Successfully imported 150 products',
      timestamp: new Date(),
      messageCount: 12
    },
    {
      id: '2',
      title: 'Excel File Analysis',
      lastMessage: 'Analyzing product categories...',
      timestamp: new Date(Date.now() - 3600000),
      messageCount: 8
    },
    {
      id: '3',
      title: 'Database Schema Review',
      lastMessage: 'pim_product table structure confirmed',
      timestamp: new Date(Date.now() - 7200000),
      messageCount: 5
    }
  ]);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-sidebar border-r border-border transition-transform duration-300 ease-in-out z-50
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      w-80 glass-effect
    `}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold gradient-text">Chat History</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </Button>
        </div>
        
        <Button className="w-full mb-3 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
        </div>
      </div>

      {/* Chat Sessions */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors border-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate text-foreground">
                    {session.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {session.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {session.messageCount} messages
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {formatTime(session.timestamp)}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
