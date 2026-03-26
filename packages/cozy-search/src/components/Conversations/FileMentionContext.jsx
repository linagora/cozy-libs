import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
} from "react";

const FileMentionContext = createContext(null);

const MENTION_REGEX = /(^|\s)@([\w. ]*)$/;

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const hasMention = MENTION_REGEX.test(inputValue);

  const mentionSearchTerm = useMemo(() => {
    const match = inputValue.match(MENTION_REGEX);
    return match ? match[2] : "";
  }, [inputValue]);

  const addFile = useCallback((file) => {
    setSelectedFiles((prev) => [...prev, file]);
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
    }),
    [
      selectedFiles,
      addFile,
      removeFile,
      handleInputChange,
      hasMention,
      mentionSearchTerm,
      getAttachmentsIDs,
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
