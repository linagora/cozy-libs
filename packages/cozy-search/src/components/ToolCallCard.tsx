import React, { useState, useCallback, useMemo } from 'react'

import { useClient } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Card from 'cozy-ui/transpiled/react/Card'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { findToolByName } from '../tools/registry'
import { getPlatformTools } from '../tools/registry'
import { useAppTools } from './AppToolsProvider'
import { validateToolArgs } from '../tools/helpers'
import type { ToolCall, ToolResult } from '../tools/types'

const STATES = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
} as const

type State = typeof STATES[keyof typeof STATES]

interface ToolCallCardProps {
  toolCall: ToolCall
  onComplete?: (id: string, result: ToolResult) => void
  completed?: boolean
}

const ToolCallCard = ({ toolCall, onComplete, completed = false }: ToolCallCardProps) => {
  const { t } = useI18n()
  const client = useClient()
  const appTools = useAppTools()
  const [state, setState] = useState<State>(completed ? STATES.SUCCESS : STATES.PENDING)
  const [result, setResult] = useState<ToolResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allTools = useMemo(
    () => [...getPlatformTools(), ...appTools],
    [appTools]
  )
  const tool = findToolByName(allTools, toolCall.name)

  const handleConfirm = useCallback(async () => {
    if (!tool) return
    setState(STATES.EXECUTING)

    try {
      const execResult = await tool.execute(toolCall.arguments, client)
      setResult(execResult)
      setState(execResult.success ? STATES.SUCCESS : STATES.ERROR)
      if (onComplete) {
        onComplete(toolCall.id, execResult)
      }
    } catch (err) {
      setError(err.message)
      setState(STATES.ERROR)
      if (onComplete) {
        onComplete(toolCall.id, { success: false, message: err.message })
      }
    }
  }, [tool, toolCall, client, onComplete])

  const handleCancel = useCallback(() => {
    setState(STATES.CANCELLED)
    if (onComplete) {
      onComplete(toolCall.id, { success: false, message: 'Cancelled by user' })
    }
  }, [toolCall.id, onComplete])

  const handleRetry = useCallback(() => {
    setState(STATES.PENDING)
    setError(null)
    setResult(null)
  }, [])

  if (!tool) {
    return (
      <Card className="u-p-1 u-mb-half">
        <Typography variant="body2" color="error">
          {t('assistant.tools.unknown_tool', { name: toolCall.name })}
        </Typography>
      </Card>
    )
  }

  const validation = validateToolArgs(tool, toolCall.arguments)

  if (!validation.valid) {
    return (
      <Card className="u-p-1 u-mb-half">
        <Typography variant="body2" color="error">
          {t('assistant.tools.invalid_params')}
        </Typography>
      </Card>
    )
  }

  const details = tool.confirmationDetails(toolCall.arguments, t)

  if (state === STATES.CANCELLED) {
    return (
      <Card className="u-p-1 u-mb-half" style={{ opacity: 0.5 }}>
        <Typography variant="subtitle1">{details.title}</Typography>
        <Typography variant="body2" color="textSecondary">
          {t('assistant.tools.cancelled')}
        </Typography>
      </Card>
    )
  }

  if (state === STATES.SUCCESS) {
    const message = tool.resultMessage(toolCall.arguments, result as ToolResult, t)
    return (
      <Card className="u-p-1 u-mb-half">
        <Typography variant="body2">{message}</Typography>
      </Card>
    )
  }

  if (state === STATES.ERROR) {
    return (
      <Card className="u-p-1 u-mb-half">
        <Typography variant="subtitle1">{details.title}</Typography>
        <Typography variant="body2" color="error">
          {error || result?.message}
        </Typography>
        <Button
          label={t('assistant.tools.retry')}
          onClick={handleRetry}
          variant="secondary"
          size="small"
          className="u-mt-half"
        />
      </Card>
    )
  }

  if (state === STATES.EXECUTING) {
    return (
      <Card className="u-p-1 u-mb-half">
        <Typography variant="subtitle1">{details.title}</Typography>
        <Spinner size="medium" />
      </Card>
    )
  }

  return (
    <Card className="u-p-1 u-mb-half">
      <Typography variant="subtitle1" className="u-mb-half">
        {details.title}
      </Typography>
      {details.fields.map((field, i) => (
        <Typography key={i} variant="body2">
          {field.label}: {field.value}
        </Typography>
      ))}
      <div className="u-flex u-flex-justify-end u-mt-half" style={{ gap: '8px' }}>
        <Button
          label={t('assistant.tools.cancel')}
          onClick={handleCancel}
          variant="secondary"
          size="small"
        />
        <Button
          label={t('assistant.tools.confirm')}
          onClick={handleConfirm}
          size="small"
        />
      </div>
    </Card>
  )
}

export default ToolCallCard
