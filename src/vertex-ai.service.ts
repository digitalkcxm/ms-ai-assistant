import { Inject, Injectable } from '@nestjs/common';
import {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from '@google-cloud/vertexai';
import type { ModelParams, Part, TextPart } from '@google-cloud/vertexai';
import {
  VERTEX_AI_MODULE_OPTIONS_TOKEN,
  VertexAIModuleOptions,
} from './vertex-ai-module-options';

@Injectable()
export class VertexAIService {
  constructor(
    @Inject(VERTEX_AI_MODULE_OPTIONS_TOKEN)
    moduleOptions: VertexAIModuleOptions,
  ) {
    this.vertexAI = new VertexAI(moduleOptions.vertexOptions);
  }

  private readonly vertexAI: VertexAI;

  async generateContentStream(
    instructions: string[],
    inputs: string[],
    model: string,
    generativeModelOptions?: Omit<ModelParams, 'model'>,
  ) {
    const generativeModel = this.vertexAI.preview.getGenerativeModel({
      model,
      ...(generativeModelOptions || {}),
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const instructionParts: Part[] = instructions.map<TextPart>(
      (instruction) => {
        return {
          text: instruction,
        };
      },
    );

    const inputParts: Part[] = inputs.map<TextPart>((instruction) => {
      return {
        text: instruction,
      };
    });

    const streamResponse = await generativeModel.generateContentStream({
      systemInstruction: {
        parts: instructionParts,
        role: 'system',
      },
      contents: [
        {
          parts: inputParts,
          role: 'user',
        },
      ],
    });

    return streamResponse;
  }
}
