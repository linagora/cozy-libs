import React from "react";

import Chip from "cozy-ui/transpiled/react/Chips";
import { useBreakpoints } from "cozy-ui/transpiled/react/providers/Breakpoints";

import { useFileMention } from "./FileMentionContext";
import styles from "./styles.styl";

const FileChipsList = () => {
  const { selectedFiles, removeFile } = useFileMention();
  const { isMobile } = useBreakpoints();

  if (selectedFiles.length === 0) {
    return null;
  }

  return (
    <div
      className={`u-flex u-flex-wrap ${styles["conversationChips-container"]}`}
      style={{ gap: "8px", marginTop: "8px" }}
    >
      {selectedFiles.map((file) => (
        <Chip
          key={file.id}
          label={file.primary}
          icon={file.icon}
          onDelete={() => removeFile(file.id)}
          className={styles["conversationChips-chip"]}
          size={isMobile ? "small" : "medium"}
          classes={{
            startIcon: styles["conversationChips-startIcon"],
            chipIcon: styles["conversationChips-chipIcon"],
            deleteIcon: styles["conversationChips-deleteIcon"],
          }}
        />
      ))}
    </div>
  );
};

export default FileChipsList;
