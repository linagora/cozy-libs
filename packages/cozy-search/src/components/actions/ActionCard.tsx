import React, { useState } from 'react'

import Alert from 'cozy-ui/transpiled/react/Alert'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { CapabilityId } from './capabilities'
import { ExecuteResult } from './executeAction'

type ActionCardStatus = 'proposed' | 'executing' | 'done' | 'error'

interface ActionCardProps {
  capabilityId: CapabilityId
  args: Record<string, string>
  execute: () => Promise<ExecuteResult>
}

const MAX_PARAM_LENGTH = 120

/**
 * Confirm-first card for an assistant app action: nothing is executed
 * until the user clicks. State is component-local only (demo scope —
 * action exchanges are not persisted).
 */
const ActionCard = ({
  capabilityId,
  args,
  execute
}: ActionCardProps): JSX.Element => {
  const { t } = useI18n()
  const [status, setStatus] = useState<ActionCardStatus>('proposed')
  const [url, setUrl] = useState<string | undefined>(undefined)

  const handleConfirm = async (): Promise<void> => {
    setStatus('executing')
    try {
      const result = await execute()
      setUrl(result.url)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const shownParams = Object.entries(args).filter(([, value]) => !!value)

  return (
    <Paper elevation={2} className="u-p-1 u-mt-half">
      <Typography variant="h6">
        {t(`assistant.app_actions.${capabilityId}.title`)}
      </Typography>
      <div className="u-stack-half u-mt-half">
        {shownParams.map(([key, value]) => (
          <Typography key={key} variant="body2">
            <span className="u-fw-bold">
              {t(`assistant.app_actions.params.${key}`)}
            </span>
            {': '}
            {value.length > MAX_PARAM_LENGTH
              ? `${value.slice(0, MAX_PARAM_LENGTH)}…`
              : value}
          </Typography>
        ))}
      </div>
      {(status === 'proposed' || status === 'executing') && (
        <Button
          className="u-mt-1"
          variant="primary"
          busy={status === 'executing'}
          disabled={status === 'executing'}
          label={t(`assistant.app_actions.${capabilityId}.confirm`)}
          onClick={handleConfirm}
        />
      )}
      {status === 'done' && (
        <Alert
          className="u-mt-1"
          severity="success"
          action={
            url ? (
              <Button
                size="small"
                variant="text"
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                label={t(`assistant.app_actions.${capabilityId}.open`)}
              />
            ) : undefined
          }
        >
          {t(`assistant.app_actions.${capabilityId}.done`)}
        </Alert>
      )}
      {status === 'error' && (
        <Alert
          className="u-mt-1"
          severity="error"
          action={
            <Button
              size="small"
              variant="text"
              label={t('assistant.app_actions.retry')}
              onClick={handleConfirm}
            />
          }
        >
          {t('assistant.app_actions.error')}
        </Alert>
      )}
    </Paper>
  )
}

export default ActionCard
