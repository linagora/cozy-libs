import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const FileMentionContext = createContext(null);

const MENTION_REGEX = /(^|\s)@([\w. ]*)/;

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const hasMention = useMemo(() => {
    return MENTION_REGEX.test(inputValue);
  }, [inputValue]);

  const mentionSearchTerm = useMemo(() => {
    const match = inputValue.match(MENTION_REGEX);
    return match ? match[2] : "";
  }, [inputValue]);

  const addFile = useCallback((file) => {
    setSelectedFiles((prev) => {
      if (prev.find((f) => f.id === file.id)) {
        return prev;
      }
      return [...prev, file];
    });
  }, []);

  const removeFile = useCallback((fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleInputChange = useCallback((text) => {
    setInputValue(text);
  }, []);

  const getAttachmentsIDs = useCallback(() => {
    return selectedFiles.map((f) => f.id);
  }, [selectedFiles]);

  const value = useMemo(
    () => ({
      selectedFiles,
      addFile,
      removeFile,
      handleInputChange,
      hasMention,
      mentionSearchTerm,
      getAttachmentsIDs,
      inputValue,
    }),
    [
      selectedFiles,
      addFile,
      removeFile,
      handleInputChange,
      hasMention,
      mentionSearchTerm,
      getAttachmentsIDs,
      inputValue,
    ]
  );

  return (
    <FileMentionContext.Provider value={value}>
      {children}
    </FileMentionContext.Provider>
  );
};

export const useFileMention = () => {
  const context = useContext(FileMentionContext);
  if (!context) {
    throw new Error("useFileMention must be used within a FileMentionProvider");
  }
  return context;
};
