import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from '@azure/identity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureOpenAI } from 'openai';

@Injectable()
export class AzureOpenAIService {
  private client: AzureOpenAI;

  constructor(private readonly configService: ConfigService) {
    const credential = new DefaultAzureCredential();
    const scope = 'https://cognitiveservices.azure.com/.default';
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);
    this.client = new AzureOpenAI({
      azureADTokenProvider,
      deployment: this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT'),
      apiVersion: this.configService.get<string>('AZURE_OPENAI_API_VERSION'),
    });
  }

  async chat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  ) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-35-turbo',
      messages,
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  }
}
