import { Module } from '@nestjs/common';
import { VertexAIService } from './vertex-ai.service';
import { VertexAIConfigurableModuleClass } from './vertex-ai-module-options';

@Module({
  providers: [VertexAIService],
  exports: [VertexAIService],
})
export class VertexAIModule extends VertexAIConfigurableModuleClass {}
