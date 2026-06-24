import {
  Contacts,
  FileTypeAudio,
  FileTypeBin,
  FileTypeCode,
  FileTypeFiles,
  FileTypeFolder,
  FileTypeImage,
  FileTypeNote,
  FileTypePdf,
  FileTypeSheet,
  FileTypeSlide,
  FileTypeText,
  FileTypeVideo,
  FileTypeZip
} from '@linagora/twake-icons'
import get from 'lodash/get'

import { isNote, isDocs } from 'cozy-client/dist/models/file'

import IconDocs from './Icons/DocsIcon'
import EncryptedFolderIcon from './Icons/EncryptedFolderIcon'
import { getFileMimetype } from './getFileMimetype'

export const getIconForSearchResult = searchResult => {
  if (searchResult.doc._type === 'io.cozy.apps') {
    return {
      type: 'app',
      app: searchResult.doc
    }
  }

  if (searchResult.slug === 'notes') {
    return {
      type: 'component',
      component: FileTypeNote
    }
  }

  if (searchResult.slug === 'drive') {
    return {
      type: 'component',
      component: getDriveMimeTypeIcon(searchResult.doc)
    }
  }

  if (searchResult.slug === 'contacts') {
    return {
      type: 'component',
      component: Contacts
    }
  }

  return {
    type: 'component',
    component: FileTypeFiles
  }
}

/**
 * Returns the appropriate icon for a given file based on its mime type and other properties.
 *
 * This method has been copied from cozy-drive
 *
 * See source: https://github.com/cozy/cozy-drive/blob/fbe2df67199683b23a40f476ccdacb00ee027459/src/lib/getMimeTypeIcon.js
 *
 * @param {import('cozy-client/types/types').IOCozyFile} file - The io.cozy.files .
 * @param {Object} [options] - Additional options.
 * @param {boolean} [options.isEncrypted] - Indicates whether the file is encrypted. Default is false.
 * @returns {import('react').ReactNode} - The icon corresponding to the file's mime type.
 */
export const getDriveMimeTypeIcon = (file, { isEncrypted = false } = {}) => {
  const isDirectory = file.type === 'directory'
  const { name, mime } = file
  if (isEncrypted) {
    return EncryptedFolderIcon
  }
  if (isDirectory) {
    return FileTypeFolder
  } else if (isNote(file)) {
    return FileTypeNote
  } else if (isDocs(file)) {
    return IconDocs
  } else {
    const iconsByMimeType = {
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
    const type = getFileMimetype(iconsByMimeType)(mime, name)
    return get(iconsByMimeType, type, FileTypeFiles)
  }
}
