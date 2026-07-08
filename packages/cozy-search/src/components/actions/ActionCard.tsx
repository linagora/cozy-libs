import React, { useState } from 'react'

import { Icon, CalendarApp, Notes } from '@linagora/twake-icons'
import Alert from 'cozy-ui/transpiled/react/Alert'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { CapabilityId } from './capabilities'
import { ExecuteResult } from './executeAction'
import { ActionLang } from './extractActionJson'
import { locales } from '../../locales'

type ActionCardStatus = 'proposed' | 'executing' | 'done' | 'error'

interface ActionCardProps {
  capabilityId: CapabilityId
  args: Record<string, string>
  execute: () => Promise<ExecuteResult>
  /** Language of the user's request; card strings follow it (app locale otherwise) */
  lang?: ActionLang
}

const MAX_PARAM_LENGTH = 120

const CAPABILITY_ICONS: Record<
  CapabilityId,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  create_note: Notes,
  create_event: CalendarApp
}

/** Resolve a dotted key ("assistant.app_actions...") in a locale dictionary. */
const lookup = (dict: unknown, key: string): string | undefined => {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      dict
    )
  return typeof value === 'string' ? value : undefined
}

/**
 * Confirm-first card for an assistant app action: nothing is executed
 * until the user clicks. State is component-local only (demo scope —
 * action exchanges are not persisted).
 */
const ActionCard = ({
  capabilityId,
  args,
  execute,
  lang
}: ActionCardProps): JSX.Element => {
  const { t } = useI18n()
  const [status, setStatus] = useState<ActionCardStatus>('proposed')
  const [url, setUrl] = useState<string | undefined>(undefined)

  // The chat answer follows the user's language (the LLM writes it), so the
  // card does too instead of following the app locale.
  const langDict = lang ? (locales as Record<string, unknown>)[lang] : undefined
  const tAction = (key: string): string => {
    const fromLang = langDict ? lookup(langDict, key) : undefined
    return fromLang ?? t(key)
  }

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
      <div className="u-flex u-flex-items-center">
        <Icon
          icon={CAPABILITY_ICONS[capabilityId]}
          size={24}
          className="u-mr-half u-flex-shrink-0"
        />
        <Typography variant="h6">
          {tAction(`assistant.app_actions.${capabilityId}.title`)}
        </Typography>
      </div>
      <div className="u-stack-half u-mt-half">
        {shownParams.map(([key, value]) => (
          <Typography key={key} variant="body2">
            <span className="u-fw-bold">
              {tAction(`assistant.app_actions.params.${key}`)}
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
          label={tAction(`assistant.app_actions.${capabilityId}.confirm`)}
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
                label={tAction(`assistant.app_actions.${capabilityId}.open`)}
              />
            ) : undefined
          }
        >
          {tAction(`assistant.app_actions.${capabilityId}.done`)}
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
              label={tAction('assistant.app_actions.retry')}
              onClick={handleConfirm}
            />
          }
        >
          {tAction('assistant.app_actions.error')}
        </Alert>
      )}
    </Paper>
  )
}

export default ActionCard
