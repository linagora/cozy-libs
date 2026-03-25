import { MessagePrimitive, useMessage } from "@assistant-ui/react";
import React from "react";

import Alert from "cozy-ui/transpiled/react/Alert";
import Box from "cozy-ui/transpiled/react/Box";
import Button from "cozy-ui/transpiled/react/Buttons";
import Icon from "cozy-ui/transpiled/react/Icon";
import Typography from "cozy-ui/transpiled/react/Typography";
import { useI18n } from "twake-i18n";

import MarkdownText from "./MarkdownText";
import ToolCallCard from "../ToolCallCard";
import { TwakeAssistantIcon } from "../AssistantIcon/TwakeAssistantIcon";
import Sources from "../Conversations/Sources/Sources";

const useIsErrorMessage = () => {
  return useMessage((s) => s.metadata?.custom?.isError === true);
};

const AssistantMessage = () => {
  const { t } = useI18n();

  const isThinking = useMessage((s) => s.status?.type === "requires-action");
  const isError = useIsErrorMessage();
  const messageId = useMessage((s) => s.id);
  const sources = useMessage((s) => s.metadata?.custom?.sources);
  const toolCalls = useMessage((s) => s.metadata?.custom?.toolCalls);
  const toolCallsCompleted = useMessage(
    (s) => s.metadata?.custom?.toolCallsCompleted
  );

  return (
    <MessagePrimitive.Root className="u-mt-1-half u-mr-3">
      {toolCalls?.length > 0 && (
        <div>
          {toolCalls.map((tc) => (
            <ToolCallCard
              key={tc.id}
              toolCall={tc}
              completed={!!toolCallsCompleted}
            />
          ))}
          {!toolCallsCompleted && toolCalls.length >= 2 && (
            <div
              className="u-flex u-flex-justify-end u-mt-half"
              style={{ gap: "8px" }}
            >
              <Button
                label={t("assistant.tools.cancel_all")}
                variant="secondary"
                size="small"
              />
              <Button label={t("assistant.tools.confirm_all")} size="small" />
            </div>
          )}
        </div>
      )}
      {isThinking && !toolCalls && (
        <Box display="flex" alignItems="center" gridGap={12}>
          <Icon
            icon={TwakeAssistantIcon}
            size={24}
            className="u-mh-half"
            color="var(--primaryColor)"
          />
          <Typography variant="h6" display="inline">
            {t("assistant.message.running")}
          </Typography>
        </Box>
      )}
      {isError ? (
        <Alert severity="error">{t("assistant.default_error")}</Alert>
      ) : (
        <MessagePrimitive.Content
          components={{
            Text: MarkdownText,
          }}
        />
      )}
      {sources?.length > 0 && (
        <Sources messageId={messageId} sources={sources} />
      )}
    </MessagePrimitive.Root>
  );
};

export default AssistantMessage;
