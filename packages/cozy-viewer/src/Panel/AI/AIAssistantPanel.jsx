import cx from 'classnames'
import PropTypes from 'prop-types'
import React, { useCallback, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from 'twake-i18n'

import { useClient } from 'cozy-client'
import { chatCompletion } from 'cozy-client/dist/models/ai'
import { fetchBlobFileById } from 'cozy-client/dist/models/file'
import flag from 'cozy-flags'
import logger from 'cozy-logger'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Stack from 'cozy-ui/transpiled/react/Stack'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'

import LoadingState from './LoadingState'
import PanelHeader from './PanelHeader'
import SummaryContent from './SummaryContent'
import {
  extractFileContent,
  validateContentSize,
  getErrorMessage
} from './helpers'
import { SUMMARY_SYSTEM_PROMPT, getSummaryUserPrompt } from './prompts'
import { useViewer } from '../../providers/ViewerProvider'

const AIAssistantPanel = ({ className }) => {
  const { t } = useI18n()
  const client = useClient()
  const { file, setIsOpenAiAssistant } = useViewer()
  const { showAlert } = useAlert()

  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()
  const fetchedFileIdRef = useRef(null)
  const inFlightFileIdRef = useRef(null)
  const activeFileIdRef = useRef(file?._id || null)

  const handleClose = () => {
    setIsOpenAiAssistant(false)
    if (location?.state?.showAIAssistant) {
      navigate('..')
    }
  }

  const summarizeFile = async ({ client, file, stream = false, model }) => {
    try {
      const fileBlob = await fetchBlobFileById(client, file?._id)
      const textContent = await extractFileContent(client, fileBlob, file)

      const { maxTokens } = flag('drive.summary') ?? {}
      validateContentSize(textContent, maxTokens)

      const messages = [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: getSummaryUserPrompt(textContent)
        }
      ]

      const summaryResponse = await chatCompletion(client, messages, {
        stream,
        model
      })

      return summaryResponse
    } catch (error) {
      logger.error('Error when summarizing file:', error)
      throw error
    }
  }

  const persistedSummary = useCallback(
    async (fileMetadata, targetFileId, summaryContent) => {
      try {
        await client
          .collection('io.cozy.files')
          .updateMetadataAttribute(targetFileId, {
            ...fileMetadata,
            description: summaryContent
          })
        fetchedFileIdRef.current = targetFileId
      } catch (error) {
        logger.error('Error when persisting summary to file metadata:', error)
      }
    },
    [client]
  )

  useEffect(() => {
    activeFileIdRef.current = file?._id || null
  }, [file])

  const fetchSummary = useCallback(
    async (force = false) => {
      const targetFileId = file?._id
      if (!targetFileId) return

      // Prevent duplicate fetches for the same file
      if (
        !force &&
        (fetchedFileIdRef.current === targetFileId ||
          inFlightFileIdRef.current === targetFileId)
      ) {
        return
      }

      inFlightFileIdRef.current = targetFileId
      setIsLoading(true)
      setError(null)

      try {
        const response = await summarizeFile({ client, file, stream: false })
        const summaryContent =
          response?.content || response?.choices?.[0]?.message?.content
        // Ignore results if the user switched to another file meanwhile
        if (activeFileIdRef.current !== targetFileId) {
          return
        }
        setSummary(summaryContent)
        const fileMetadata = file.metadata || {}
        await persistedSummary(fileMetadata, targetFileId, summaryContent)
      } catch (err) {
        if (activeFileIdRef.current === targetFileId) {
          setError(getErrorMessage(err, t))
        }
      } finally {
        if (inFlightFileIdRef.current === targetFileId) {
          inFlightFileIdRef.current = null
        }
        if (activeFileIdRef.current === targetFileId) {
          setIsLoading(false)
        }
      }
    },
    [client, file, persistedSummary, t]
  )

  const handleRefresh = () => {
    fetchedFileIdRef.current = null
    fetchSummary(true)
  }

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary)
      showAlert({ message: t('Viewer.ai.copied'), severity: 'success' })
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return (
    <Stack
      spacing="s"
      className={cx('u-flex u-flex-column u-h-100', className)}
    >
      <Paper
        className={cx({
          'u-flex-grow-1': !isLoading
        })}
        elevation={2}
        square
      >
        <PanelHeader onClose={handleClose} t={t} />
        {!isLoading && (
          <SummaryContent
            summary={summary}
            error={error}
            onRefresh={handleRefresh}
            onCopy={handleCopy}
            t={t}
          />
        )}
      </Paper>
      {isLoading && <LoadingState onStop={handleClose} t={t} />}
    </Stack>
  )
}

AIAssistantPanel.propTypes = {
  className: PropTypes.string
}

export default AIAssistantPanel
