import React from "react";
import { Chip } from "cozy-ui/transpiled/react/Chips";
import Icon from "cozy-ui/transpiled/react/Icon";
import FolderIcon from "cozy-ui/transpiled/react/Icons/Folder";

import { useFileMention } from "./FileMentionContext";

const FileChipsList = () => {
  const { selectedFiles, removeFile } = useFileMention();

  if (selectedFiles.length === 0) {
    return null;
  }

  return (
    <div className="u-flex u-flex-items-center u-flex-wrap u-mt-half">
      {selectedFiles.map((file) => (
        <Chip
          key={file.id}
          label={file.primary || file.slug}
          onDelete={() => removeFile(file.id)}
          className="u-mr-half u-mb-half"
          startIcon={<Icon icon={FolderIcon} size={16} />}
        />
      ))}
    </div>
  );
};

export default FileChipsList;
