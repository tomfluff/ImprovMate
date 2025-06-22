// Original issue: https://github.com/microsoft/TypeScript/issues/28308#issuecomment-650802278
// =======
// UPDATE 2024-01-06: File is not needed anymore, but I'm keeping it here for reference.
// ------
// When running: npm i --save-sev @types/audioworklet -D
// and adding: "compilerOptions": {"types": [ "@types/audioworklet" ]} to tsconfig.json
// This file is not needed anymore.
// See: https://github.com/microsoft/TypeScript/issues/28308#issuecomment-1512509870
// =======

interface AudioParamDescriptor {
  name: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  automationRate?: AutomationRate;
}

interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare var AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

declare function registerProcessor(
  name: string,
  processorCtor: (new (
    options?: AudioWorkletNodeOptions
  ) => AudioWorkletProcessor) & {
    parameterDescriptors?: AudioParamDescriptor[];
  }
): void;
