
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Database, Brain, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  data?: any;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: '1',
      type: 'ai',
      content: "👋 Welcome to DataScribe AI! I'm your intelligent assistant for database operations. You can:\n\n• Upload Excel, CSV, or text files for data processing\n• Ask me to analyze and insert data into your MySQL database\n• Get intelligent suggestions for data mapping and validation\n\nHow can I help you today?",
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
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

  const processFiles = async (files: File[]) => {
    const validFiles: FileInfo[] = [];
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'text/plain' // .txt
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
    setInputValue('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(userMessage),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userMessage: Message): string => {
    if (userMessage.files && userMessage.files.length > 0) {
      return `🔍 I've analyzed your uploaded files:\n\n${userMessage.files.map(file => 
        `• **${file.name}** (${formatFileSize(file.size)})`
      ).join('\n')}\n\nI can help you:\n1. Preview and validate the data structure\n2. Map columns to your pim_product table fields\n3. Handle duplicates and data cleaning\n4. Execute the database insertion\n\nWould you like me to start by analyzing the data structure and suggesting field mappings?`;
    } else {
      return `I understand you want to work with your database. Here are some ways I can help:\n\n🗄️ **Database Operations:**\n• Insert data from files into pim_product table\n• Validate data before insertion\n• Handle duplicates intelligently\n\n📊 **Data Processing:**\n• Parse Excel, CSV, and text files\n• Clean and validate data\n• Map columns to database fields\n\n💡 **Smart Suggestions:**\n• Recommend data transformations\n• Identify potential issues\n• Optimize insertion strategies\n\nPlease upload a file or ask me a specific question about your data!`;
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border glass-effect">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">DataScribe AI</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Database Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="w-4 h-4" />
          <span>Connected to bi_sync_data</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[80%] p-4 ${
                message.type === 'user' 
                  ? 'chat-bubble-user text-white' 
                  : 'chat-bubble-ai'
              }`}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                {message.files && (
                  <div className="mt-3 space-y-2">
                    {message.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-xs">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="chat-bubble-ai p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></div>
                  <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* File Upload Area */}
      {uploadedFiles.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border glass-effect">
        <div
          className="relative border-2 border-dashed border-border rounded-lg p-4 transition-colors hover:border-primary/50"
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your data or drop files here..."
                className="min-h-[60px] resize-none border-none bg-transparent focus:ring-0 focus:border-none"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0)}
                className="bg-primary hover:bg-primary/90"
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
  );
};

export default ChatInterface;
