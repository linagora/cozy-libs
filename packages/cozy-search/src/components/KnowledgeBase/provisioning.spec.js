import { models } from 'cozy-client'
import flag from 'cozy-flags'

import {
  assistantIdFromName,
  ensureProvisionedAssistants,
  getDefaultProvisionedAssistantId,
  isMagicFolderId,
  resolveProvisionedFolder
} from './provisioning'

jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  models: {
    ...jest.requireActual('cozy-client').models,
    folder: { getReferencedFolder: jest.fn() }
  }
}))

jest.mock('cozy-flags', () => jest.fn())

const notFound = () => Object.assign(new Error('not_found'), { status: 404 })
const conflict = () => Object.assign(new Error('conflict'), { status: 409 })

const makeClient = ({
  assistants = {},
  accounts = [],
  files = {},
  ensuredDirId = 'created-dir'
} = {}) => {
  const filesCollection = {
    statById: jest.fn(async id => {
      if (!files[id]) throw notFound()
      return { data: files[id] }
    }),
    ensureDirectoryExists: jest.fn().mockResolvedValue(ensuredDirId)
  }
  const client = {
    collection: jest.fn(doctype => {
      if (doctype === 'io.cozy.files') return filesCollection
      throw new Error(`unexpected collection ${doctype}`)
    }),
    query: jest.fn(async definition => {
      if (definition.doctype === 'io.cozy.ai.chat.assistants') {
        const doc = assistants[definition.id]
        if (!doc) throw notFound()
        return { data: doc }
      }
      if (definition.doctype === 'io.cozy.accounts') {
        return { data: accounts }
      }
      throw new Error(`unexpected query ${definition.doctype}`)
    }),
    save: jest.fn(async doc => {
      const saved = { ...doc, _rev: '1-a' }
      // The real saveKnowledgeBase re-reads the assistant it just created.
      if (doc._type === 'io.cozy.ai.chat.assistants')
        assistants[doc._id] = saved
      return { data: saved }
    })
  }
  return { client, filesCollection }
}

describe('assistantIdFromName', () => {
  it('normalizes accents, case, spaces and punctuation', () => {
    expect(assistantIdFromName('Mes documents')).toBe('mes-documents')
    expect(assistantIdFromName('Réunions')).toBe('reunions')
    expect(assistantIdFromName('  Été / Hiver 2026!  ')).toBe('ete-hiver-2026')
    expect(assistantIdFromName('___secret')).toBe('secret')
  })

  it('returns an empty string when nothing usable remains', () => {
    expect(assistantIdFromName('***')).toBe('')
    expect(assistantIdFromName('')).toBe('')
    expect(assistantIdFromName(undefined)).toBe('')
  })
})

describe('isMagicFolderId', () => {
  it('recognizes io.cozy.apps/<slug>', () => {
    expect(isMagicFolderId('io.cozy.apps/meet')).toBe(true)
    expect(isMagicFolderId('a1b2c3')).toBe(false)
    expect(isMagicFolderId('io.cozy.apps/')).toBe(false)
  })

  it('recognizes the nested magic folders', () => {
    expect(isMagicFolderId('io.cozy.apps/administrative/papers')).toBe(true)
    expect(isMagicFolderId('io.cozy.apps/photos/upload')).toBe(true)
  })
})

describe('resolveProvisionedFolder', () => {
  beforeEach(() => models.folder.getReferencedFolder.mockReset())

  it('uses an existing folder by id', async () => {
    const { client } = makeClient({
      files: { 'dir-1': { _id: 'dir-1', type: 'directory', trashed: false } }
    })
    expect(await resolveProvisionedFolder(client, { dirId: 'dir-1' })).toBe(
      'dir-1'
    )
  })

  it('refuses a trashed folder, a file, or a missing id without fallback', async () => {
    const { client, filesCollection } = makeClient({
      files: {
        // A real DirDoc has no `trashed` field: only its path says so.
        trashed: {
          _id: 'trashed',
          type: 'directory',
          path: '/.cozy_trash/Docs'
        },
        flagged: { _id: 'flagged', type: 'directory', trashed: true },
        file: { _id: 'file', type: 'file', trashed: false }
      }
    })
    expect(
      await resolveProvisionedFolder(client, { dirId: 'trashed', dirName: 'X' })
    ).toBeNull()
    expect(
      await resolveProvisionedFolder(client, { dirId: 'flagged', dirName: 'X' })
    ).toBeNull()
    expect(
      await resolveProvisionedFolder(client, { dirId: 'file', dirName: 'X' })
    ).toBeNull()
    expect(
      await resolveProvisionedFolder(client, { dirId: 'nope', dirName: 'X' })
    ).toBeNull()
    expect(filesCollection.ensureDirectoryExists).not.toHaveBeenCalled()
  })

  it('resolves a magic folder through getReferencedFolder', async () => {
    const { client } = makeClient()
    models.folder.getReferencedFolder.mockResolvedValue({ _id: 'meet-dir' })

    expect(
      await resolveProvisionedFolder(client, { dirId: 'io.cozy.apps/meet' })
    ).toBe('meet-dir')
    expect(models.folder.getReferencedFolder).toHaveBeenCalledWith(client, {
      _type: 'io.cozy.apps',
      _id: 'io.cozy.apps/meet'
    })
  })

  it('returns null when the magic folder does not exist yet', async () => {
    const { client } = makeClient()
    models.folder.getReferencedFolder.mockResolvedValue(null)
    expect(
      await resolveProvisionedFolder(client, { dirId: 'io.cozy.apps/meet' })
    ).toBeNull()
  })

  it('finds or creates the folder by name at the root', async () => {
    const { client, filesCollection } = makeClient({ ensuredDirId: 'docs-dir' })
    expect(await resolveProvisionedFolder(client, { dirName: 'Docs' })).toBe(
      'docs-dir'
    )
    expect(filesCollection.ensureDirectoryExists).toHaveBeenCalledWith('/Docs')
  })

  it('accepts the root folder without looking it up', async () => {
    const { client, filesCollection } = makeClient()
    expect(
      await resolveProvisionedFolder(client, {
        dirId: 'io.cozy.files.root-dir'
      })
    ).toBe('io.cozy.files.root-dir')
    expect(filesCollection.statById).not.toHaveBeenCalled()
  })
})

describe('ensureProvisionedAssistants', () => {
  beforeEach(() => {
    models.folder.getReferencedFolder.mockReset()
  })

  it('creates the folder, the account, the assistant and its knowledge base', async () => {
    const { client } = makeClient({ ensuredDirId: 'docs-dir' })

    const result = await ensureProvisionedAssistants(client, [
      { name: 'Mes documents', dirName: 'Docs', prompt: 'Hello' }
    ])

    expect(result).toEqual({
      created: ['mes-documents'],
      ensured: [],
      skipped: []
    })
    // 1st save: the openrag account; 2nd save: the assistant; 3rd: knowledgeBase.
    const saved = client.save.mock.calls.map(([doc]) => doc)
    expect(saved[0]).toMatchObject({
      _type: 'io.cozy.accounts',
      account_type: 'openrag',
      identifier: 'accountName',
      auth: { accountName: 'Twake' },
      data: { model: 'openrag' }
    })
    expect(saved[1]).toMatchObject({
      _type: 'io.cozy.ai.chat.assistants',
      _id: 'mes-documents',
      name: 'Mes documents',
      prompt: 'Hello',
      icon: null,
      relationships: {
        provider: {
          data: {
            _type: 'io.cozy.accounts',
            metadata: { providerId: 'openrag' }
          }
        }
      }
    })
    expect(saved[2]).toMatchObject({
      _id: 'mes-documents',
      knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'docs-dir' }]
    })
  })

  it('provisions a whole-Drive assistant from the root dirId', async () => {
    const { client, filesCollection } = makeClient()

    const result = await ensureProvisionedAssistants(client, [
      { name: 'Everything', dirId: 'io.cozy.files.root-dir' }
    ])

    expect(result.created).toEqual(['everything'])
    expect(filesCollection.statById).not.toHaveBeenCalled()
    const saved = client.save.mock.calls.map(([doc]) => doc)
    expect(saved[2].knowledgeBase).toEqual([
      { doctype: 'io.cozy.files', dirId: 'io.cozy.files.root-dir' }
    ])
  })

  it('reuses an existing openrag account', async () => {
    const { client } = makeClient({
      accounts: [
        { _id: 'acc-1', _type: 'io.cozy.accounts', account_type: 'openrag' }
      ]
    })

    await ensureProvisionedAssistants(client, [
      { name: 'Docs', dirName: 'Docs' }
    ])

    const saved = client.save.mock.calls.map(([doc]) => doc)
    expect(saved.some(doc => doc._type === 'io.cozy.accounts')).toBe(false)
    expect(saved[0].relationships.provider.data._id).toBe('acc-1')
  })

  it('leaves an existing assistant with a live folder alone', async () => {
    const { client } = makeClient({
      assistants: {
        docs: {
          _id: 'docs',
          _type: 'io.cozy.ai.chat.assistants',
          knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'dir-1' }]
        }
      },
      files: { 'dir-1': { _id: 'dir-1', type: 'directory', trashed: false } }
    })

    const result = await ensureProvisionedAssistants(client, [
      { name: 'Docs', dirName: 'Docs' }
    ])

    expect(result.ensured).toEqual(['docs'])
    expect(client.save).not.toHaveBeenCalled()
  })

  it('re-attaches the flag folder to an assistant that lost it', async () => {
    const { client, filesCollection } = makeClient({
      assistants: {
        docs: { _id: 'docs', _type: 'io.cozy.ai.chat.assistants' }
      },
      ensuredDirId: 'docs-dir'
    })

    const result = await ensureProvisionedAssistants(client, [
      { name: 'Docs', dirName: 'Docs' }
    ])

    expect(result).toEqual({ created: [], ensured: ['docs'], skipped: [] })
    expect(filesCollection.ensureDirectoryExists).toHaveBeenCalledWith('/Docs')
    // saveKnowledgeBase re-attached the folder.
    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'docs',
        knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'docs-dir' }]
      })
    )
  })

  it('re-attaches the flag folder to an assistant that fell back to the root', async () => {
    const { client } = makeClient({
      assistants: {
        docs: {
          _id: 'docs',
          _type: 'io.cozy.ai.chat.assistants',
          knowledgeBase: [
            { doctype: 'io.cozy.files', dirId: 'io.cozy.files.root-dir' }
          ]
        }
      },
      ensuredDirId: 'docs-dir'
    })

    const result = await ensureProvisionedAssistants(client, [
      { name: 'Docs', dirName: 'Docs' }
    ])

    expect(result).toEqual({ created: [], ensured: ['docs'], skipped: [] })
    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'docs',
        knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'docs-dir' }]
      })
    )
  })

  it('leaves a whole-Drive assistant alone when the flag asks for the root', async () => {
    const { client } = makeClient({
      assistants: {
        docs: {
          _id: 'docs',
          _type: 'io.cozy.ai.chat.assistants',
          knowledgeBase: [
            { doctype: 'io.cozy.files', dirId: 'io.cozy.files.root-dir' }
          ]
        }
      }
    })

    const result = await ensureProvisionedAssistants(client, [
      { name: 'Docs', dirId: 'io.cozy.files.root-dir' }
    ])

    expect(result).toEqual({ created: [], ensured: ['docs'], skipped: [] })
    expect(client.save).not.toHaveBeenCalled()
  })

  it('skips an existing assistant whose folder is trashed', async () => {
    const { client } = makeClient({
      assistants: {
        docs: {
          _id: 'docs',
          _type: 'io.cozy.ai.chat.assistants',
          knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'dir-1' }]
        }
      },
      files: {
        'dir-1': {
          _id: 'dir-1',
          type: 'directory',
          path: '/.cozy_trash/Docs'
        }
      }
    })

    const result = await ensureProvisionedAssistants(client, [
      { name: 'Docs', dirName: 'Docs' }
    ])

    expect(result.ensured).toEqual([])
    expect(result.skipped).toEqual([
      { id: 'docs', reason: 'folder dir-1 is missing or trashed' }
    ])
  })

  it('treats a save conflict as an existing assistant', async () => {
    const { client } = makeClient({ ensuredDirId: 'docs-dir' })
    let queries = 0
    const original = client.query.getMockImplementation()
    client.query.mockImplementation(async definition => {
      if (definition.doctype === 'io.cozy.ai.chat.assistants') {
        queries += 1
        if (queries === 1) throw notFound()
        return {
          data: {
            _id: 'docs',
            knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'docs-dir' }]
          }
        }
      }
      return original(definition)
    })
    client.save.mockImplementation(async doc => {
      if (doc._type === 'io.cozy.ai.chat.assistants') throw conflict()
      return { data: { ...doc, _id: doc._id || 'acc-new' } }
    })
    client.collection('io.cozy.files').statById.mockResolvedValue({
      data: { _id: 'docs-dir', type: 'directory', trashed: false }
    })

    const result = await ensureProvisionedAssistants(client, [
      { name: 'Docs', dirName: 'Docs' }
    ])

    expect(result.created).toEqual([])
    expect(result.ensured).toEqual(['docs'])
  })

  it('skips invalid entries and keeps going after a failure', async () => {
    const { client } = makeClient({ ensuredDirId: 'docs-dir' })
    client
      .collection('io.cozy.files')
      .ensureDirectoryExists.mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue('docs-dir')

    const result = await ensureProvisionedAssistants(client, [
      { name: '***', dirName: 'X' },
      { name: 'No folder' },
      { name: 'First', dirName: 'A' },
      { name: 'Second', dirName: 'B' }
    ])

    expect(result.created).toEqual(['second'])
    expect(result.skipped).toEqual([
      { id: '', reason: 'invalid name' },
      { id: 'no-folder', reason: 'dirId or dirName is required' },
      { id: 'first', reason: 'boom' }
    ])
  })

  it('returns an empty result for an absent or empty flag', async () => {
    const { client } = makeClient()
    expect(await ensureProvisionedAssistants(client, undefined)).toEqual({
      created: [],
      ensured: [],
      skipped: []
    })
    expect(await ensureProvisionedAssistants(client, [])).toEqual({
      created: [],
      ensured: [],
      skipped: []
    })
  })
})

describe('getDefaultProvisionedAssistantId', () => {
  beforeEach(() => flag.mockReset())

  it('returns null without the flag or without a default entry', () => {
    flag.mockReturnValue(null)
    expect(getDefaultProvisionedAssistantId()).toBeNull()
    flag.mockReturnValue('not-an-array')
    expect(getDefaultProvisionedAssistantId()).toBeNull()
    flag.mockReturnValue([{ name: 'Docs', dirName: 'Docs' }])
    expect(getDefaultProvisionedAssistantId()).toBeNull()
  })

  it('derives the id of the first default entry with a valid name', () => {
    flag.mockReturnValue([
      { name: '!!!', dirName: 'X', default: true },
      { name: 'Mes documents', dirName: 'Docs', default: true },
      { name: 'Autre', dirName: 'Autre', default: true }
    ])
    expect(getDefaultProvisionedAssistantId()).toBe('mes-documents')
    expect(flag).toHaveBeenCalledWith('rag.assistants.autoprovision')
  })
})
