/**
 * CozyRealtimeChatAdapter implements assistant-ui's ChatModelAdapter interface
 * to integrate with the Cozy backend's AI chat API.
 *
 * This adapter:
 * 1. POSTs to /ai/chat/conversations/{conversationId} to start a conversation
 * 2. Uses StreamBridge to receive streaming content from WebSocket events
 * 3. Yields content progressively as it arrives
 */

import type {
  ChatModelAdapter,
  ChatModelRunOptions,
  ChatModelRunResult,
} from "@assistant-ui/react";

import Minilog from "cozy-minilog";

import { StreamBridge } from "./StreamBridge";
import { sanitizeChatContent } from "../helpers";
import type { AssistantTool } from "../../tools/types";
import { parseSlashCommand, toToolSchemas } from "../../tools/helpers";

const log = Minilog("🔍 [CozyRealtimeChatAdapter]");

type CozyClient = {
  stackClient: {
    fetchJSON: (
      method: string,
      path: string,
      body?: object
    ) => Promise<unknown>;
  };
};

export interface CozyRealtimeChatAdapterOptions {
  client: CozyClient;
  conversationId: string;
  streamBridge: StreamBridge;
  assistantId?: string;
  getFileIDs?: () => string[];
  allTools?: AssistantTool[];
  toolsEnabled?: boolean;
}

/**
 * Finds the user query to send to the backend.
 * For new messages: gets the last user message
 * For reload: finds the last user message (may need to skip assistant messages)
 */
const findUserQuery = (
  messages: ChatModelRunOptions["messages"]
): string | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "user") {
      const textContent = msg.content.find((part) => part.type === "text");
      if (textContent && textContent.type === "text") {
        return textContent.text;
      }
    }
  }
  return null;
};

/**
 * Creates a ChatModelAdapter that integrates with Cozy's backend.
 * The adapter posts messages to the backend and yields streaming responses
 * from the WebSocket via StreamBridge.
 */
export const createCozyRealtimeChatAdapter = (
  options: CozyRealtimeChatAdapterOptions,
  t: (key: string, options?: Record<string, unknown>) => string
): ChatModelAdapter => ({
  async *run({
    messages,
    abortSignal,
  }: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    const {
      client,
      conversationId,
      streamBridge,
      assistantId,
      getFileIDs,
      allTools,
      toolsEnabled,
    } = options;

    const fileIDs = getFileIDs?.() || [];
    let userQuery = findUserQuery(messages);
    if (!userQuery) {
      log.error("No user message found in:", messages);
      return;
    }

    let toolSchemas: ReturnType<typeof toToolSchemas> | undefined;
    const parsed = parseSlashCommand(userQuery);
    if (parsed) {
      const tool = allTools?.find(
        (t) => t.category === parsed.category && t.name === parsed.toolName
      );
      if (tool) {
        toolSchemas = toToolSchemas([tool]);
      }
      userQuery = parsed.text;
    } else if (toolsEnabled && allTools?.length) {
      toolSchemas = toToolSchemas(allTools);
    }

    const stream = streamBridge.createStream(conversationId);

    try {
      // Note: For reload, this sends the same query again to regenerate
      yield {
        content: [{ type: "text", text: "" }],
        status: { type: "requires-action", reason: "tool-calls" },
      };
      await client.stackClient.fetchJSON(
        "POST",
        `/ai/chat/conversations/${conversationId}`,
        {
          q: userQuery,
          assistantID: assistantId,
          ...(toolSchemas && toolSchemas.length > 0
            ? { tools: toolSchemas }
            : {}),
          ...(fileIDs.length > 0 && { fileIDs }),
        }
      );

      let fullText = "";
      let wasAborted = false;

      for await (const chunk of stream) {
        if (abortSignal?.aborted) {
          wasAborted = true;
          streamBridge.cleanup(conversationId);
          break;
        }

        fullText += chunk;
        const sanitizedText = sanitizeChatContent(fullText);

        yield {
          content: [{ type: "text", text: sanitizedText }],
          status: { type: "running" },
        };
      }

      if (!wasAborted) {
        const toolCalls = streamBridge.getToolCalls(conversationId);

        if (toolCalls && toolCalls.length > 0) {
          yield {
            content: [{ type: "text", text: "" }],
            status: { type: "requires-action", reason: "tool-calls" },
            metadata: { custom: { toolCalls } },
          };
          streamBridge.cleanup(conversationId);
          return;
        }

        const finalText = sanitizeChatContent(fullText);
        const sources = streamBridge.getSources(conversationId);
        yield {
          content: [{ type: "text", text: finalText }],
          status: { type: "complete", reason: "stop" },
          ...(sources ? { metadata: { custom: { sources } } } : {}),
        };
        streamBridge.cleanup(conversationId);
      }
    } catch (error) {
      log.error("Error:", error);
      streamBridge.cleanup(conversationId);

      yield {
        content: [{ type: "text", text: t("assistant.default_error") }],
        status: { type: "incomplete", reason: "error" },
        metadata: { custom: { isError: true } },
      };
    }
  },
});
