import { generateWebLink } from 'cozy-client'
import { fetchURL } from 'cozy-client/dist/models/note'

import { CapabilityId } from './capabilities'
import { markdownToProseMirror, NOTES_SCHEMA } from './markdownToProseMirror'

export interface ActionClient {
  stackClient: {
    fetchJSON: (method: string, path: string, body?: object) => Promise<unknown>
  }
  getStackClient: () => { uri: string }
  getInstanceOptions: () => { subdomain: string }
}

export interface ExecuteResult {
  url?: string
}

const createNote = async (
  client: ActionClient,
  params: Record<string, string>
): Promise<ExecuteResult> => {
  const res = (await client.stackClient.fetchJSON('POST', '/notes', {
    data: {
      type: 'io.cozy.notes.documents',
      attributes: {
        title: params.title,
        schema: NOTES_SCHEMA,
        content: markdownToProseMirror(params.content || '')
      }
    }
  })) as { data: { id: string } }
  const url = await fetchURL(client, { id: res.data.id })
  return { url }
}

const createEvent = (
  client: ActionClient,
  params: Record<string, string>
): ExecuteResult => {
  // Deep-link prefill only (per spec): the calendar app may ignore unknown
  // query params, in which case the user finishes the event manually — the
  // card keeps the params visible either way.
  const searchParams = (
    [
      ['title', params.title],
      ['start', params.start],
      ['end', params.end],
      ['attendee', params.attendee]
    ] as Array<[string, string | undefined]>
  ).filter((entry): entry is [string, string] => !!entry[1])

  const url = generateWebLink({
    cozyUrl: client.getStackClient().uri,
    subDomainType: client.getInstanceOptions().subdomain,
    slug: 'calendar',
    searchParams
  })
  window.open(url, '_blank', 'noopener')
  return { url }
}

export const executeAction = async (
  client: ActionClient,
  id: CapabilityId,
  params: Record<string, string>
): Promise<ExecuteResult> => {
  if (id === 'create_note') {
    return createNote(client, params)
  }
  return createEvent(client, params)
}
