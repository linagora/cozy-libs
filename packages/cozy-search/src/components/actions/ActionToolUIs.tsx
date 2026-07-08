import { makeAssistantToolUI } from '@assistant-ui/react'
import React from 'react'

import { useClient } from 'cozy-client'

import ActionCard from './ActionCard'
import { CapabilityId } from './capabilities'
import { ActionClient, executeAction } from './executeAction'
import { ActionLang } from './extractActionJson'

interface ActionToolArgs {
  lang?: ActionLang
  params?: Record<string, string>
}

interface ActionToolRendererProps {
  capabilityId: CapabilityId
  args: Record<string, string>
  lang?: ActionLang
}

const ActionToolRenderer = ({
  capabilityId,
  args,
  lang
}: ActionToolRendererProps): JSX.Element => {
  const client = useClient()
  return (
    <ActionCard
      capabilityId={capabilityId}
      args={args}
      lang={lang}
      execute={(): ReturnType<typeof executeAction> =>
        executeAction(client as unknown as ActionClient, capabilityId, args)
      }
    />
  )
}

const makeActionToolUI = (
  capabilityId: CapabilityId
): ReturnType<typeof makeAssistantToolUI> =>
  makeAssistantToolUI<ActionToolArgs, unknown>({
    toolName: capabilityId,
    render: ({ args }) => (
      <ActionToolRenderer
        capabilityId={capabilityId}
        args={args.params ?? {}}
        lang={args.lang}
      />
    )
  })

// Mount these once inside AssistantRuntimeProvider (see
// CozyAssistantRuntimeProvider); they register a card renderer for the
// matching tool-call content parts and render nothing themselves.
export const CreateNoteToolUI = makeActionToolUI('create_note')
export const CreateEventToolUI = makeActionToolUI('create_event')
