export { default as AssistantLink } from "./components/Search/AssistantLink";
export { default as AssistantDesktop } from "./components/AssistantDesktop";
export { default as AssistantMobile } from "./components/AssistantMobile";
export { default as AssistantDialog } from "./components/Views/AssistantDialog";
export { default as CreateAssistantDialog } from "./components/Views/CreateAssistantDialog";
export { default as SearchDialog } from "./components/Views/SearchDialog";
export { default as AiText } from "./components/Icons/AiText";

// New assistant-ui based components
export { default as CozyAssistantRuntimeProvider } from "./components/CozyAssistantRuntimeProvider";
export { default as CozyComposer } from "./components/Conversations/ConversationComposer";
export {
  StreamBridge,
  createCozyRealtimeChatAdapter,
} from "./components/adapters";
export { default as AssistantView } from "./components/Views/AssistantView";

// Tools API
export type {
  AssistantTool,
  ConfirmationDetails,
  ToolResult,
  ToolSchema,
  ToolCall,
} from "./tools/types";
export { getPlatformTools, findToolByName } from "./tools/registry";
export {
  toToolSchemas,
  validateToolArgs,
  parseSlashCommand,
} from "./tools/helpers";
export {
  default as AppToolsProvider,
  useAppTools,
} from "./components/AppToolsProvider";
