import { Injectable } from '@nestjs/common';
import { VertexAIService } from './vertex-ai.service';

@Injectable()
export class AppService {
  constructor(private readonly vertexAIService: VertexAIService) {}

  async analyzeTicket(instructions: string[], inputs: string[]) {
    const streamResponse = await this.vertexAIService.generateContentStream(
      instructions,
      inputs,
      'gemini-1.5-flash-002',
    );

    const aggregatedResponse = await streamResponse.response;

    return aggregatedResponse?.candidates?.flatMap((candidate) =>
      candidate?.content?.parts?.flatMap((part) => part.text.split('\n\n')),
    );
  }
}
