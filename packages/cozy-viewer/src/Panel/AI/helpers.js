import { extractText } from 'cozy-client/dist/models/ai'

import { roughTokensEstimation, isTextMimeType } from '../../helpers'
import { ContentExtractionError } from '../../helpers/ContentExtractionError'
import { DocumentTooLargeError } from '../../helpers/DocumentTooLargeError'

/**
 * Extracts content from a file blob
 * For text-based files, reads content directly. For other files, uses AI extraction.
 * @param {object} client - Cozy client instance
 * @param {Blob} fileBlob - File blob to extract content from
 * @param {object} file - File metadata object with mime type and name
 * @returns {Promise<string>} JSON stringified content
 * @throws {ContentExtractionError} If content extraction fails or returns empty content
 */
export const extractFileContent = async (client, fileBlob, file) => {
  let content

  if (isTextMimeType(file.mime)) {
    content = await fileBlob.text()
  } else {
    content = await extractText(client, fileBlob, {
      name: file.name,
      mime: file.mime
    })
  }

  if (!content || content.trim().length === 0) {
    throw new ContentExtractionError()
  }

  return JSON.stringify(content)
}

/**
 * Validates that content size does not exceed the maximum token limit
 * @param {string} textContent - Content to validate
 * @param {number} maxTokens - Maximum number of tokens allowed
 * @throws {DocumentTooLargeError} If content exceeds the token limit
 */
export const validateContentSize = (textContent, maxTokens) => {
  if (!maxTokens) return

  const tokens = roughTokensEstimation(textContent)

  if (tokens > maxTokens) {
    throw new DocumentTooLargeError()
  }
}

/**
 * Gets the appropriate error message based on error code
 * @param {Error} error - Error object with optional code property
 * @param {Function} t - Translation function
 * @returns {string} Translated error message
 */
export const getErrorMessage = (error, t) => {
  const errorMap = {
    DOCUMENT_TOO_LARGE: 'Viewer.ai.error.documentTooLarge',
    CONTENT_EXTRACTION_FAILED: 'Viewer.ai.error.extractContent'
  }

  const errorKey = errorMap[error.code] || 'Viewer.ai.error.summary'
  return t(errorKey)
}
