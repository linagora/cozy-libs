import type { AssistantTool, ToolSchema } from "./types";

export const toToolSchemas = (tools: AssistantTool[]): ToolSchema[] =>
  tools.map(({ name, description, parameters }) => ({
    name,
    description,
    parameters,
  }));

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export const validateToolArgs = (
  tool: AssistantTool,
  args: Record<string, unknown>
): ValidationResult => {
  const schema = tool.parameters as {
    properties?: Record<string, { type?: string }>;
    required?: string[];
  };
  const errors: string[] = [];

  if (schema.required) {
    for (const field of schema.required) {
      if (args[field] === undefined || args[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (args[key] !== undefined && prop.type) {
        const actualType = typeof args[key];
        if (prop.type === "string" && actualType !== "string") {
          errors.push(`Field "${key}" should be string, got ${actualType}`);
        }
        if (prop.type === "number" && actualType !== "number") {
          errors.push(`Field "${key}" should be number, got ${actualType}`);
        }
        if (prop.type === "boolean" && actualType !== "boolean") {
          errors.push(`Field "${key}" should be boolean, got ${actualType}`);
        }
      }
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
};

interface ParsedSlashCommand {
  category: string;
  toolName: string;
  text: string;
}

export const parseSlashCommand = (input: string): ParsedSlashCommand | null => {
  const match = input.match(
    /^\/([a-zA-Z][a-zA-Z0-9]*)-([a-zA-Z][a-zA-Z0-9]*)(?:\s(.*))?$/
  );
  if (!match) return null;

  return {
    category: match[1],
    toolName: match[2],
    text: match[3]?.trim() || "",
  };
};
