
import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  files?: FileInfo[];
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

interface ChatInterfaceProps {
  onNewMessage?: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onNewMessage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const validFiles: FileInfo[] = [];
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/plain'
    ];

    for (const file of files) {
      if (supportedTypes.includes(file.type) || file.name.endsWith('.csv')) {
        validFiles.push({
          name: file.name,
          size: file.size,
          type: file.type || 'text/csv'
        });
      } else {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not supported. Please upload Excel, CSV, or text files.`,
          variant: "destructive"
        });
      }
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files uploaded successfully",
        description: `${validFiles.length} file(s) ready for processing.`
      });
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue || `Uploaded ${uploadedFiles.length} file(s) for processing`,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    onNewMessage?.(inputValue);
    setInputValue('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Real API call to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          files: uploadedFiles,
          history: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response || "I'm ready to help you process your data and insert it into the database.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area - Scrollable with proper height */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="px-4 py-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
                  <h3 className="text-xl font-semibold mb-2 gradient-text">Welcome to DataScribe AI</h3>
                  <p className="text-muted-foreground">
                    Upload files or ask me anything about your data processing needs.
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'ai' && (
                    <Avatar className="w-8 h-8 mt-1 shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="w-4 h-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex-1 space-y-2 ${message.type === 'user' ? 'max-w-md ml-auto' : 'max-w-full'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {message.type === 'ai' ? 'DataScribe AI' : 'You'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className={`rounded-lg p-4 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-muted/20 border border-border/30 backdrop-blur-sm'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      
                      {message.files && (
                        <div className="mt-3 space-y-2">
                          {message.files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-background/50 rounded border">
                              <Upload className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs font-medium">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <Avatar className="w-8 h-8 mt-1 shrink-0">
                      <AvatarFallback className="bg-muted">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="w-8 h-8 mt-1 shrink-0">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="w-4 h-4 text-primary animate-pulse" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">DataScribe AI</span>
                    </div>
                    <div className="bg-muted/20 border border-border/30 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></div>
                        <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* File Upload Preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-background/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Fixed at bottom with clean design */}
      <div className="px-4 py-4 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative border border-border rounded-xl bg-background/80 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/10"
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
          >
            <div className="flex items-end gap-3 p-4">
              <div className="flex-1">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your data or drop files here..."
                  className="min-h-[60px] max-h-[120px] resize-none border-none bg-transparent focus:ring-0 focus-visible:ring-0 focus:border-none text-sm placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="h-10 w-10 p-0 rounded-lg hover:bg-muted/50"
                >
                  <Upload className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0)}
                  className="h-10 w-10 p-0 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
