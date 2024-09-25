import { ModelParams, VertexInit } from '@google-cloud/vertexai';
import { ConfigurableModuleBuilder } from '@nestjs/common';

export type VertexAIModuleOptions = {
  vertexOptions: VertexInit;
  defaultGenerativeModelOptions?: ModelParams;
};

export const {
  ConfigurableModuleClass: VertexAIConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: VERTEX_AI_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<VertexAIModuleOptions>().build();
