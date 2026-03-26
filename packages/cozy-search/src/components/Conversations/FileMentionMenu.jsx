import React, { useEffect, useState, useRef } from "react";
import {
  Popper,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Icon,
} from "cozy-ui/transpiled/react";
import FolderIcon from "cozy-ui/transpiled/react/Icons/Folder";
import debounce from "lodash/debounce";

import { useFileMention } from "./FileMentionContext";
import { useFetchResult } from "../Search/useFetchResult";

const SEARCH_OPTIONS = {
  doctypes: ["io.cozy.files"],
  excludeFilters: { type: "directory" },
};

const FileMentionMenu = ({ anchorEl, searchTerm, composerRuntime }) => {
  const { addFile, handleInputChange } = useFileMention();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { results, isLoading } = useFetchResult(searchTerm, SEARCH_OPTIONS);
  const menuRef = useRef(null);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  const handleSelect = (file) => {
    const currentText = composerRuntime.getState().text;
    const newText = currentText.replace(/(^|\s)@[\w. ]*$/, "$1");

    composerRuntime.setText(newText);
    handleInputChange(newText);
    addFile(file);
  };

  const handleKeyDown = (ev) => {
    if (!results || results.length === 0) return;

    switch (ev.key) {
      case "ArrowDown":
        ev.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        ev.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
      case "Tab":
        ev.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        ev.preventDefault();
        const currentText = composerRuntime.getState().text;
        const newText = currentText.replace(/(^|\s)@[\w. ]*$/, "$1");
        composerRuntime.setText(newText);
        handleInputChange(newText);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const menuElement = menuRef.current;
    if (!menuElement) return;

    menuElement.addEventListener("keydown", handleKeyDown);
    return () => {
      menuElement.removeEventListener("keydown", handleKeyDown);
    };
  }, [results, selectedIndex, searchTerm]);

  if (!searchTerm) {
    return (
      <Popper anchorEl={anchorEl} open placement="bottom-start">
        <Paper>
          <List>
            <ListItem>
              <ListItemText primary="Type to search files" />
            </ListItem>
          </List>
        </Paper>
      </Popper>
    );
  }

  if (isLoading) {
    return (
      <Popper anchorEl={anchorEl} open placement="bottom-start">
        <Paper>
          <List>
            <ListItem>
              <ListItemText primary="Loading..." />
            </ListItem>
          </List>
        </Paper>
      </Popper>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Popper anchorEl={anchorEl} open placement="bottom-start">
        <Paper>
          <List>
            <ListItem>
              <ListItemText primary="No files found" />
            </ListItem>
          </List>
        </Paper>
      </Popper>
    );
  }

  return (
    <Popper anchorEl={anchorEl} open placement="bottom-start">
      <Paper ref={menuRef}>
        <List>
          {results.map((result, index) => (
            <ListItem
              key={result.id}
              button
              selected={index === selectedIndex}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <ListItemIcon>
                <Icon icon={FolderIcon} size={20} />
              </ListItemIcon>
              <ListItemText
                primary={result.primary || result.slug}
                secondary={result.secondary || ""}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Popper>
  );
};

export default FileMentionMenu;
