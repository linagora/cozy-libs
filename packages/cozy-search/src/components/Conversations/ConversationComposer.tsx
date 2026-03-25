import {
  ComposerPrimitive,
  useComposerRuntime,
  useThread,
  useComposer,
} from "@assistant-ui/react";
import cx from "classnames";
import React, { useCallback } from "react";

import flag from "cozy-flags";
import Switch from "cozy-ui/transpiled/react/Switch";
import { useBreakpoints } from "cozy-ui/transpiled/react/providers/Breakpoints";
import Typography from "cozy-ui/transpiled/react/Typography";
import { useI18n } from "twake-i18n";

import ConversationBar from "./ConversationBar";
import AssistantSelection from "../Assistant/AssistantSelection";
import { useAssistant } from "../AssistantProvider";
import TwakeKnowledgeSelector from "../TwakeKnowledges/TwakeKnowledgeSelector";
import FileMentionProvider from "./FileMentionContext";
import FileChipsList from "./FileChipsList";
import SlashCommandAutocomplete from "../SlashCommandAutocomplete";
import type { AssistantTool } from "../tools/types";

const ConversationComposer = () => {
  const { isMobile } = useBreakpoints();
  const composerRuntime = useComposerRuntime();
  const isRunning = useThread((state) => state.isRunning);
  const isThreadEmpty = useThread((state) => state.messages.length === 0);
  const { setOpenedKnowledgePanel, toolsEnabled, setToolsEnabled } =
    useAssistant();
  const { t } = useI18n();

  const value = useComposer((state) => state.text);
  const isEmpty = useComposer((state) => state.isEmpty);

  const showAutocomplete = value.startsWith("/");

  const handleSelectTool = useCallback(
    (tool: AssistantTool) => {
      const slug = `/${tool.category}-${tool.name} `;
      composerRuntime.setText(slug);
    },
    [composerRuntime]
  );

  const handleSend = useCallback(() => {
    composerRuntime.send();
  }, [composerRuntime]);

  const handleCancel = useCallback(() => {
    composerRuntime.cancel();
  }, [composerRuntime]);

  const handleKeyDown = useCallback(
    (ev) => {
      if (!isMobile) {
        if (ev.shiftKey && ev.key === "Enter") {
          return;
        }

        if (ev.key === "Enter") {
          ev.preventDefault();
          handleSend();
        }
      }
    },
    [isMobile, handleSend]
  );

  return (
    <FileMentionProvider>
      <ComposerPrimitive.Root
        className={cx("u-w-100 u-maw-7 u-mh-auto", {
          "u-card u-bxz u-elevation-1": isMobile,
        })}
      >
        <div style={{ position: "relative" }}>
          {showAutocomplete && (
            <SlashCommandAutocomplete
              inputValue={value}
              onSelect={handleSelectTool}
            />
          )}
          <ConversationBar
            elevation={isMobile ? 0 : 1}
            disabledHover={!!isMobile}
            value={value}
            isEmpty={isEmpty}
            isRunning={isRunning}
            onKeyDown={handleKeyDown}
            onCancel={handleCancel}
            onSend={handleSend}
          />
        </div>

        <FileChipsList />

        <div className="u-flex u-flex-items-center u-flex-justify-between u-mt-1">
          <div className="u-flex u-flex-items-center" style={{ gap: "4px" }}>
            {flag("cozy.assistant.create-assistant.enabled") && (
              <AssistantSelection disabled={!isThreadEmpty} />
            )}
            {flag("cozy.assistant.source-knowledge.enabled") && (
              <TwakeKnowledgeSelector
                onSelectTwakeKnowledge={setOpenedKnowledgePanel}
              />
            )}
          </div>
          <div className="u-flex u-flex-items-center" style={{ gap: "4px" }}>
            <Typography variant="caption" color="textSecondary">
              {t("assistant.tools.toggle_label")}
            </Typography>
            <Switch
              checked={toolsEnabled}
              onChange={() => setToolsEnabled((prev) => !prev)}
              size="small"
            />
          </div>
        </div>
      </ComposerPrimitive.Root>
    </FileMentionProvider>
  );
};

export default ConversationComposer;
