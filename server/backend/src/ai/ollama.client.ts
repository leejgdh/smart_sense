import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_k?: number;
    top_p?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('OLLAMA_URL', 'http://localhost:11434');
    this.model = this.configService.get('OLLAMA_MODEL', 'phi3:mini');

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async generate(prompt: string, options?: any): Promise<string> {
    try {
      const request: OllamaGenerateRequest = {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature || 0.7,
          top_k: options?.top_k || 40,
          top_p: options?.top_p || 0.9,
        },
      };

      this.logger.debug(`Generating response for prompt: ${prompt.substring(0, 100)}...`);

      const response = await this.client.post<OllamaGenerateResponse>('/api/generate', request);

      return response.data.response;
    } catch (error) {
      this.logger.error(`Ollama generation failed: ${error.message}`);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const response = await this.client.post('/api/chat', {
        model: this.model,
        messages,
        stream: false,
      });

      return response.data.message.content;
    } catch (error) {
      this.logger.error(`Ollama chat failed: ${error.message}`);
      throw new Error(`Failed to chat with AI: ${error.message}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/');
      return response.status === 200;
    } catch (error) {
      this.logger.error(`Ollama health check failed: ${error.message}`);
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models.map((m: any) => m.name);
    } catch (error) {
      this.logger.error(`Failed to list models: ${error.message}`);
      return [];
    }
  }
}
