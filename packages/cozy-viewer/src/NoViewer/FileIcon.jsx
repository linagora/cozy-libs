import {
  Icon,
  FileTypeBin,
  FileTypeCode,
  FileTypeFiles,
  FileTypePdf,
  FileTypeSheet,
  FileTypeSlide,
  FileTypeText,
  FileTypeZip
} from '@linagora/twake-icons'
import React from 'react'

const FileIcon = ({ type }) => {
  let icon

  switch (type) {
    case 'bin':
      icon = FileTypeBin
      break
    case 'code':
      icon = FileTypeCode
      break
    case 'spreadsheet':
      icon = FileTypeSheet
      break
    case 'slide':
      icon = FileTypeSlide
      break
    case 'text':
      icon = FileTypeText
      break
    case 'zip':
      icon = FileTypeZip
      break
    case 'pdf':
      icon = FileTypePdf
      break
    default:
      icon = FileTypeFiles
      break
  }

  return <Icon icon={icon} width={160} height={140} />
}

export default FileIcon
