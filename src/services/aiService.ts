
interface OllamaConfig {
  host: string;
  port: number;
  model: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export class AIService {
  private config: OllamaConfig;

  constructor(config?: Partial<OllamaConfig>) {
    this.config = {
      host: '10.51.0.15',
      port: 11434,
      model: 'qwen2.5:7b',
      ...config
    };
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`http://${this.config.host}:${this.config.port}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: OllamaResponse = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('AI Service error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async analyzeFileForDatabase(fileContent: string, fileName: string): Promise<string> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a database expert assistant. Analyze the provided file content and suggest how to map it to a MySQL pim_product table. 
      
      Consider these aspects:
      1. Data structure and column mapping
      2. Data types and validation
      3. Duplicate handling strategies
      4. Data cleaning requirements
      5. Insertion strategy recommendations
      
      Provide practical, actionable suggestions.`
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Please analyze this ${fileName} file content and suggest database mapping:\n\n${fileContent.substring(0, 2000)}${fileContent.length > 2000 ? '...' : ''}`
    };

    return this.generateResponse([systemMessage, userMessage]);
  }

  async generateSQLQueries(dataDescription: string, tableName: string = 'pim_product'): Promise<string> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a MySQL database expert. Generate safe, optimized INSERT statements for the ${tableName} table based on the provided data description. Include proper error handling and duplicate checking.`
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Generate INSERT statements for this data: ${dataDescription}`
    };

    return this.generateResponse([systemMessage, userMessage]);
  }
}

export const aiService = new AIService();
