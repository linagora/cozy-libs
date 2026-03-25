export interface AssistantTool {
  name: string;
  category: string;
  description: string;
  parameters: Record<string, unknown>;
  label: string;
  execute: (
    params: Record<string, unknown>,
    client: unknown
  ) => Promise<ToolResult>;
  confirmationDetails: (
    params: Record<string, unknown>,
    t: (key: string, options?: Record<string, unknown>) => string
  ) => ConfirmationDetails;
  resultMessage: (
    params: Record<string, unknown>,
    result: ToolResult,
    t: (key: string, options?: Record<string, unknown>) => string
  ) => string;
}

export interface ConfirmationDetails {
  title: string;
  fields: Array<{ label: string; value: string }>;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}
