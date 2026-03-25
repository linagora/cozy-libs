import { createFolder } from "./definitions/createFolder";
import { share } from "./definitions/share";
import { move } from "./definitions/move";
import { rename } from "./definitions/rename";
import type { AssistantTool } from "./types";

export const platformTools: AssistantTool[] = [
  createFolder,
  share,
  move,
  rename,
];

export const getPlatformTools = (): AssistantTool[] => platformTools;

export const findToolByName = (
  tools: AssistantTool[],
  name: string
): AssistantTool | undefined => tools.find((t) => t.name === name);
