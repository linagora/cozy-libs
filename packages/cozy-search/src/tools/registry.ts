import { createFolder } from "./definitions/createFolder";
import type { AssistantTool } from "./types";

export const platformTools: AssistantTool[] = [createFolder];

export const getPlatformTools = (): AssistantTool[] => platformTools;

export const findToolByName = (
  tools: AssistantTool[],
  name: string
): AssistantTool | undefined => tools.find((t) => t.name === name);
