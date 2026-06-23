import {
  FileTypeAudio,
  FileTypeBin,
  FileTypeCode,
  FileTypeImage,
  FileTypePdf,
  FileTypeSheet,
  FileTypeSlide,
  FileTypeText,
  FileTypeVideo,
  FileTypeZip
} from '@linagora/twake-icons'

const iconsBySubType = {
  audio: FileTypeAudio,
  bin: FileTypeBin,
  code: FileTypeCode,
  image: FileTypeImage,
  pdf: FileTypePdf,
  slide: FileTypeSlide,
  sheet: FileTypeSheet,
  text: FileTypeText,
  video: FileTypeVideo,
  zip: FileTypeZip
}

const mappingMimetypeSubtype = {
  word: 'text',
  text: 'text',
  zip: 'zip',
  pdf: 'pdf',
  spreadsheet: 'sheet',
  excel: 'sheet',
  sheet: 'sheet',
  presentation: 'slide',
  powerpoint: 'slide'
}

export const getFileSubtype = file => {
  const mimetype = file.mime === 'application/octet-stream' ? 'text' : file.mime
  const [type, subtype] = mimetype.split('/')
  if (type === 'application') {
    const existingType = subtype.match(
      Object.keys(mappingMimetypeSubtype).join('|')
    )
    return existingType ? mappingMimetypeSubtype[existingType[0]] : undefined
  }
  return undefined
}

export const getFileIcon = file => {
  const subtype =
    mappingMimetypeSubtype[file.class] || mappingMimetypeSubtype.text
  return iconsBySubType[subtype]
}
