import { toToolSchemas, validateToolArgs, parseSlashCommand } from "./helpers";
import type { AssistantTool } from "./types";

const makeTool = (overrides: Partial<AssistantTool> = {}): AssistantTool => ({
  name: "createFolder",
  category: "files",
  description: "Create a folder",
  parameters: {
    type: "object",
    properties: { name: { type: "string" } },
    required: ["name"],
  },
  label: "Create a folder",
  execute: jest.fn(),
  confirmationDetails: jest.fn(),
  resultMessage: jest.fn(),
  ...overrides,
});

describe("toToolSchemas", () => {
  it("should extract only LLM-relevant fields", () => {
    const tools = [makeTool()];
    const schemas = toToolSchemas(tools);

    expect(schemas).toEqual([
      {
        name: "createFolder",
        description: "Create a folder",
        parameters: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
      },
    ]);
  });

  it("should not include execute, label, confirmationDetails, or resultMessage", () => {
    const schemas = toToolSchemas([makeTool()]);
    const schema = schemas[0];

    expect(schema).not.toHaveProperty("execute");
    expect(schema).not.toHaveProperty("label");
    expect(schema).not.toHaveProperty("confirmationDetails");
    expect(schema).not.toHaveProperty("resultMessage");
    expect(schema).not.toHaveProperty("category");
  });
});

describe("validateToolArgs", () => {
  it("should return valid for correct args", () => {
    const tool = makeTool();
    const result = validateToolArgs(tool, { name: "Invoices" });
    expect(result.valid).toBe(true);
  });

  it("should return invalid when required field is missing", () => {
    const tool = makeTool();
    const result = validateToolArgs(tool, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("should return invalid when field has wrong type", () => {
    const tool = makeTool();
    const result = validateToolArgs(tool, { name: 123 });
    expect(result.valid).toBe(false);
  });
});

describe("parseSlashCommand", () => {
  it("should parse a full slash command with text", () => {
    const result = parseSlashCommand(
      "/files-createFolder a folder called Invoices"
    );
    expect(result).toEqual({
      category: "files",
      toolName: "createFolder",
      text: "a folder called Invoices",
    });
  });

  it("should parse a slash command with no text", () => {
    const result = parseSlashCommand("/files-createFolder");
    expect(result).toEqual({
      category: "files",
      toolName: "createFolder",
      text: "",
    });
  });

  it("should return null for non-slash input", () => {
    const result = parseSlashCommand("Create a folder please");
    expect(result).toBeNull();
  });

  it("should return null for slash without valid format", () => {
    const result = parseSlashCommand("/justcommand");
    expect(result).toBeNull();
  });
});
