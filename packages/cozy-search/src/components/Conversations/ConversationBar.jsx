import { ComposerPrimitive, useComposerRuntime } from "@assistant-ui/react";
import cx from "classnames";
import React, { useRef, useCallback } from "react";

import Button from "cozy-ui/transpiled/react/Buttons";
import Icon from "cozy-ui/transpiled/react/Icon";
import IconButton from "cozy-ui/transpiled/react/IconButton";
import PaperplaneIcon from "cozy-ui/transpiled/react/Icons/Paperplane";
import StopIcon from "cozy-ui/transpiled/react/Icons/Stop";
import SearchBar from "cozy-ui/transpiled/react/SearchBar";
import useEventListener from "cozy-ui/transpiled/react/hooks/useEventListener";
import { useBreakpoints } from "cozy-ui/transpiled/react/providers/Breakpoints";
import { useI18n } from "twake-i18n";

import styles from "./styles.styl";
import FileMentionMenu from "./FileMentionMenu";
import { useFileMention } from "./FileMentionContext";

const MENTION_REGEX = /(^|\s)@([\w. ]*)$/;

const ConversationBar = ({
  value,
  isEmpty,
  isRunning,
  onKeyDown,
  onSend,
  onCancel,
  ...props
}) => {
  const { t } = useI18n();
  const { isMobile } = useBreakpoints();
  const inputRef = useRef();
  const composerRuntime = useComposerRuntime();
  const { handleInputChange, hasMention } = useFileMention();

  const handleChange = useCallback(
    (e) => {
      handleInputChange(e.target.value);
    },
    [handleInputChange]
  );

  // to adjust input height for multiline when typing in it
  // eslint-disable-next-line react-hooks/refs
  useEventListener(inputRef.current, "input", () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  });

  const handleSend = () => {
    if (isEmpty) return;

    onSend();
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (isEmpty) return;

    onKeyDown(e);
  };

  return (
    <div className="u-w-100 u-maw-7 u-mh-auto">
      <SearchBar
        {...props}
        className={cx(styles["conversationBar"], {
          [styles["conversationBar--mobile"]]: isMobile,
        })}
        icon={null}
        size="auto"
        placeholder={t("assistant.search.placeholder")}
        value={value}
        disabledClear
        onChange={handleChange}
        componentsProps={{
          inputBase: {
            inputRef: inputRef,
            className: "u-pv-0",
            rows: 1,
            multiline: true,
            inputProps: {
              className: styles["conversationBar-input"],
            },
            autoFocus: !isMobile,
            inputComponent: ComposerPrimitive.Input,
            endAdornment: isRunning ? (
              <IconButton className="u-p-0 u-mr-half">
                <Button
                  size="small"
                  component="div"
                  className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle"
                  classes={{ label: "u-flex u-w-auto" }}
                  label={<Icon icon={StopIcon} size={12} />}
                  onClick={onCancel}
                />
              </IconButton>
            ) : (
              <IconButton className="u-p-0 u-mr-half">
                <Button
                  size="small"
                  component="div"
                  className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle"
                  classes={{ label: "u-flex u-w-auto" }}
                  label={<Icon icon={PaperplaneIcon} size={12} rotate={-45} />}
                  disabled={isEmpty}
                  onClick={handleSend}
                />
              </IconButton>
            ),
            onKeyDown: handleKeyDown,
          },
        }}
      />
      {hasMention && (
        <FileMentionMenu
          anchorEl={inputRef.current}
          composerRuntime={composerRuntime}
        />
      )}
    </div>
  );
};

export default ConversationBar;
