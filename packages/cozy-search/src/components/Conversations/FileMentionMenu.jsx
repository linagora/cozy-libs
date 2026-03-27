import React, { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";

import Popper from "cozy-ui/transpiled/react/Popper";
import Paper from "cozy-ui/transpiled/react/Paper";
import List from "cozy-ui/transpiled/react/List";
import ListItem from "cozy-ui/transpiled/react/ListItem";
import ListItemIcon from "cozy-ui/transpiled/react/ListItemIcon";
import ListItemText from "cozy-ui/transpiled/react/ListItemText";
import Typography from "cozy-ui/transpiled/react/Typography";

import { useFetchResult } from "../Search/useFetchResult";
import { useFileMention } from "./FileMentionContext";

const FILE_SEARCH_OPTIONS = {
  doctypes: ["io.cozy.files"],
  excludeFilters: { type: "directory" },
};

const MENTION_REGEX = /(^|\s)@([\w. ]*)$/;

const FileMentionMenu = ({ anchorEl, composerRuntime }) => {
  const {
    mentionSearchTerm,
    handleInputChange,
    addFile,
    hasMention,
    removeFile,
  } = useFileMention();

  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const debouncedSearchTerm = useMemo(() => {
    return mentionSearchTerm.trim();
  }, [mentionSearchTerm]);

  const { results, isLoading } = useFetchResult(
    debouncedSearchTerm,
    FILE_SEARCH_OPTIONS
  );

  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results.filter((r) => r.type !== "directory");
  }, [results]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [mentionSearchTerm]);

  const handleSelectFile = (file) => {
    addFile(file);

    const currentText = composerRuntime.getState().text;
    const newText = currentText.replace(MENTION_REGEX, "");
    composerRuntime.setText(newText);
    handleInputChange(newText);
  };

  const handleKeyDown = (e) => {
    if (!hasMention) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
      case "Tab":
        if (filteredResults.length > 0) {
          e.preventDefault();
          handleSelectFile(filteredResults[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        const currentText = composerRuntime.getState().text;
        const newText = currentText.replace(MENTION_REGEX, "");
        composerRuntime.setText(newText);
        handleInputChange(newText);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (hasMention) {
        handleKeyDown(e);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [hasMention, highlightedIndex, filteredResults]);

  if (!hasMention) {
    return null;
  }

  return (
    <Popper
      open={hasMention}
      anchorEl={anchorEl}
      placement="bottom-start"
      style={{ zIndex: 1500 }}
    >
      <Paper elevation={3} style={{ maxHeight: 300, width: 400 }}>
        <List>
          {isLoading ? (
            <ListItem>
              <ListItemText primary="Searching..." />
            </ListItem>
          ) : !mentionSearchTerm ? (
            <ListItem>
              <ListItemText primary="Type to search files" />
            </ListItem>
          ) : filteredResults.length === 0 ? (
            <ListItem>
              <ListItemText primary="No files found" />
            </ListItem>
          ) : (
            filteredResults.map((file, index) => (
              <ListItem
                key={file.id}
                onClick={() => handleSelectFile(file)}
                selected={index === highlightedIndex}
                button
              >
                <ListItemIcon>{file.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body1">{file.primary}</Typography>
                  }
                  secondary={
                    <Typography variant="caption">{file.secondary}</Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Popper>
  );
};

export default FileMentionMenu;
