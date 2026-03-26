export interface AssistantTool {
  name: string
  category: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
  label: string
  execute: (
    params: Record<string, unknown>,
    client: unknown
  ) => Promise<ToolResult>
  confirmationDetails: (
    params: Record<string, unknown>,
    t: (key: string, options?: Record<string, unknown>) => string
  ) => ConfirmationDetails
  resultMessage: (
    params: Record<string, unknown>,
    result: ToolResult,
    t: (key: string, options?: Record<string, unknown>) => string
  ) => string
}

export interface ConfirmationDetails {
  title: string
  fields: Array<{ label: string; value: string }>
}

export interface ToolResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

/**
 * LLM-ready tool schema — only the fields the LLM needs.
 * Produced by toToolSchemas() in helpers.ts.
 */
export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}

/**
 * A tool call received from the LLM via WebSocket.
 */
export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}
