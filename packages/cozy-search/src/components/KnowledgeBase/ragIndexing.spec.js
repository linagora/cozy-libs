import { Q } from 'cozy-client'

import { ROOT_DIR_ID } from './knowledgeBase'
import {
  RAG_INDEX_FILES_DEBOUNCE,
  createRagIndexTriggers,
  fetchAssistants,
  findRagIndexTriggers,
  makeRagIndexTriggerAttributes,
  migrateAssistantsWithoutFolder,
  removeDuplicateRagIndexTriggers,
  setupRagIndexing
} from './ragIndexing'

const FILES = 'io.cozy.files'
const ASSISTANTS = 'io.cozy.ai.chat.assistants'
const TRIGGERS = 'io.cozy.triggers'

const filesTrigger = {
  _id: 'trigger-files',
  _type: 'io.cozy.triggers',
  type: '@event',
  worker: 'rag-index',
  arguments: FILES,
  debounce: '30s',
  message: { doctype: FILES }
}
const assistantsTrigger = {
  _id: 'trigger-assistants',
  _type: 'io.cozy.triggers',
  type: '@event',
  worker: 'rag-index',
  arguments: ASSISTANTS,
  message: { doctype: FILES }
}
const cronFilesTrigger = {
  _id: 'trigger-cron-files',
  _type: 'io.cozy.triggers',
  type: '@cron',
  worker: 'rag-index',
  arguments: FILES,
  message: { doctype: FILES }
}

const triggerDoc = doctype => ({
  _type: TRIGGERS,
  ...makeRagIndexTriggerAttributes(doctype)
})

const makeClient = ({ triggers = [], assistants = [] } = {}) => {
  const triggersCollection = {
    launch: jest.fn().mockResolvedValue({ data: { _id: 'job-1' } })
  }
  const client = {
    collection: jest.fn(doctype => {
      if (doctype === TRIGGERS) return triggersCollection
      throw new Error(`unexpected collection ${doctype}`)
    }),
    query: jest.fn().mockResolvedValue({ data: triggers }),
    queryAll: jest.fn(async () => assistants),
    save: jest.fn(async doc => ({
      data:
        doc._type === TRIGGERS
          ? { _id: `created-${doc.arguments}`, ...doc }
          : doc
    })),
    destroy: jest.fn(async doc => ({ data: doc }))
  }
  return { client, triggersCollection }
}

describe('makeRagIndexTriggerAttributes', () => {
  it('debounces the files trigger only', () => {
    expect(makeRagIndexTriggerAttributes(FILES)).toEqual({
      type: '@event',
      arguments: FILES,
      debounce: RAG_INDEX_FILES_DEBOUNCE,
      worker: 'rag-index',
      message: { doctype: FILES }
    })
    expect(makeRagIndexTriggerAttributes(ASSISTANTS)).toEqual({
      type: '@event',
      arguments: ASSISTANTS,
      worker: 'rag-index',
      message: { doctype: FILES }
    })
    expect(RAG_INDEX_FILES_DEBOUNCE).toBe('30s')
  })
})

describe('findRagIndexTriggers', () => {
  it('sorts the triggers by kind', async () => {
    const { client } = makeClient({
      triggers: [filesTrigger, assistantsTrigger]
    })
    const found = await findRagIndexTriggers(client)
    expect(client.query).toHaveBeenCalledWith(
      Q(TRIGGERS).where({ worker: 'rag-index' }),
      { as: 'io.cozy.triggers/worker/rag-index' }
    )
    expect(found.files).toBe(filesTrigger)
    expect(found.assistants).toBe(assistantsTrigger)
  })

  it('returns nulls when there is nothing', async () => {
    const { client } = makeClient()
    expect(await findRagIndexTriggers(client)).toEqual({
      files: null,
      assistants: null
    })
  })

  it('ignores a rag-index trigger that is not an @event trigger', async () => {
    const { client } = makeClient({ triggers: [cronFilesTrigger] })
    const found = await findRagIndexTriggers(client)
    expect(found.files).toBeNull()
    expect(found.assistants).toBeNull()
  })

  it('returns the trigger with the smallest id when there are several', async () => {
    const olderFilesTrigger = { ...filesTrigger, _id: 'a-trigger-files' }
    const { client } = makeClient({
      triggers: [filesTrigger, olderFilesTrigger]
    })
    const found = await findRagIndexTriggers(client)
    expect(found.files).toBe(olderFilesTrigger)
  })
})

describe('removeDuplicateRagIndexTriggers', () => {
  const duplicateFiles = { ...filesTrigger, _id: 'z-trigger-files' }
  const duplicateAssistants = { ...assistantsTrigger, _id: 'z-trigger-a' }

  it('keeps the trigger with the smallest id of each kind', async () => {
    const { client } = makeClient({
      triggers: [
        duplicateFiles,
        filesTrigger,
        assistantsTrigger,
        duplicateAssistants,
        cronFilesTrigger
      ]
    })
    await expect(removeDuplicateRagIndexTriggers(client)).resolves.toEqual([
      'z-trigger-files',
      'z-trigger-a'
    ])
    expect(client.destroy).toHaveBeenCalledTimes(2)
    expect(client.destroy).toHaveBeenCalledWith(duplicateFiles)
    expect(client.destroy).toHaveBeenCalledWith(duplicateAssistants)
  })

  it('removes nothing without duplicates', async () => {
    const { client } = makeClient({
      triggers: [filesTrigger, assistantsTrigger]
    })
    await expect(removeDuplicateRagIndexTriggers(client)).resolves.toEqual([])
    expect(client.destroy).not.toHaveBeenCalled()
  })

  it('skips a duplicate another session already removed', async () => {
    const { client } = makeClient({
      triggers: [filesTrigger, duplicateFiles]
    })
    client.destroy.mockRejectedValue(
      Object.assign(new Error('not found'), { status: 404 })
    )
    await expect(removeDuplicateRagIndexTriggers(client)).resolves.toEqual([])
  })

  it('throws on any other failure', async () => {
    const { client } = makeClient({
      triggers: [filesTrigger, duplicateFiles]
    })
    client.destroy.mockRejectedValue(new Error('down'))
    await expect(removeDuplicateRagIndexTriggers(client)).rejects.toThrow(
      'down'
    )
  })
})

describe('migrateAssistantsWithoutFolder', () => {
  it('appends the root entry to assistants without folder, keeping other entries', async () => {
    const { client } = makeClient({
      assistants: [
        {
          _id: 'a1',
          _type: ASSISTANTS,
          knowledgeBase: [{ doctype: 'io.cozy.email' }]
        },
        {
          _id: 'a2',
          _type: ASSISTANTS,
          knowledgeBase: [{ doctype: FILES, dirId: 'd' }]
        },
        { _id: 'a3', _type: ASSISTANTS }
      ]
    })
    const migrated = await migrateAssistantsWithoutFolder(client)
    expect(migrated).toEqual(['a1', 'a3'])
    expect(client.queryAll).toHaveBeenCalledWith(Q(ASSISTANTS).limitBy(1000), {
      as: `${ASSISTANTS}/all`
    })
    expect(client.save).toHaveBeenCalledTimes(2)
    expect(client.save).toHaveBeenCalledWith({
      _id: 'a1',
      _type: ASSISTANTS,
      knowledgeBase: [
        { doctype: 'io.cozy.email' },
        { doctype: FILES, dirId: ROOT_DIR_ID }
      ]
    })
    expect(client.save).toHaveBeenCalledWith({
      _id: 'a3',
      _type: ASSISTANTS,
      knowledgeBase: [{ doctype: FILES, dirId: ROOT_DIR_ID }]
    })
  })

  it('ignores a conflict on one assistant and goes on', async () => {
    const { client } = makeClient({
      assistants: [
        { _id: 'a1', _type: ASSISTANTS },
        { _id: 'a2', _type: ASSISTANTS }
      ]
    })
    client.save.mockImplementationOnce(async () => {
      throw Object.assign(new Error('conflict'), { status: 409 })
    })
    expect(await migrateAssistantsWithoutFolder(client)).toEqual(['a2'])
  })
})

describe('setupRagIndexing', () => {
  let warn
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => warn.mockRestore())

  it('creates the missing triggers and launches the files one', async () => {
    const { client, triggersCollection } = makeClient({
      triggers: [assistantsTrigger]
    })
    const result = await setupRagIndexing(client)

    expect(client.save).toHaveBeenCalledTimes(1)
    expect(client.save).toHaveBeenCalledWith(triggerDoc(FILES))
    expect(triggersCollection.launch).toHaveBeenCalledTimes(1)
    expect(triggersCollection.launch.mock.calls[0][0]._id).toBe(
      'created-io.cozy.files'
    )
    expect(result).toEqual({ triggers: [FILES], migrated: [], errors: [] })
  })

  it('removes the files trigger it could not launch, keeping the assistants one', async () => {
    const { client, triggersCollection } = makeClient()
    const launchError = new Error('launch failed')
    triggersCollection.launch.mockRejectedValue(launchError)

    const result = await setupRagIndexing(client)

    expect(client.destroy).toHaveBeenCalledTimes(1)
    expect(client.destroy.mock.calls[0][0]._id).toBe('created-io.cozy.files')
    expect(result.triggers).toEqual([ASSISTANTS])
    expect(result.errors).toEqual([launchError])
  })

  it('creates the files trigger when the existing one is not an @event trigger', async () => {
    const { client } = makeClient({
      triggers: [cronFilesTrigger, assistantsTrigger]
    })
    const result = await setupRagIndexing(client)

    expect(client.save).toHaveBeenCalledWith(triggerDoc(FILES))
    expect(result.triggers).toEqual([FILES])
  })

  it('creates the assistants trigger without launching it', async () => {
    const { client, triggersCollection } = makeClient({
      triggers: [filesTrigger]
    })
    const result = await setupRagIndexing(client)
    expect(client.save).toHaveBeenCalledWith(triggerDoc(ASSISTANTS))
    expect(triggersCollection.launch).not.toHaveBeenCalled()
    expect(result.triggers).toEqual([ASSISTANTS])
  })

  it('touches nothing when both triggers exist', async () => {
    const { client } = makeClient({
      triggers: [filesTrigger, assistantsTrigger]
    })
    const result = await setupRagIndexing(client)
    expect(client.save).not.toHaveBeenCalled()
    expect(result).toEqual({ triggers: [], migrated: [], errors: [] })
  })

  it('migrates the assistants without folder', async () => {
    const { client } = makeClient({
      triggers: [filesTrigger, assistantsTrigger],
      assistants: [{ _id: 'a1', _type: ASSISTANTS }]
    })
    const result = await setupRagIndexing(client)
    expect(result.migrated).toEqual(['a1'])
    expect(client.save).toHaveBeenCalledTimes(1)
  })

  it('logs a 403 from an older stack and still migrates', async () => {
    const { client } = makeClient({
      assistants: [{ _id: 'a1', _type: ASSISTANTS }]
    })
    const save = client.save.getMockImplementation()
    client.save.mockImplementation(async doc => {
      if (doc._type === TRIGGERS) {
        throw Object.assign(new Error('forbidden'), { status: 403 })
      }
      return save(doc)
    })
    const result = await setupRagIndexing(client)
    expect(result.triggers).toEqual([])
    // The first failing creation aborts the trigger setup: one error.
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].status).toBe(403)
    expect(result.migrated).toEqual(['a1'])
    expect(warn).toHaveBeenCalled()
  })

  it('never throws, even when the listing fails', async () => {
    const { client } = makeClient()
    client.query.mockRejectedValue(new Error('down'))
    const result = await setupRagIndexing(client)
    expect(result.triggers).toEqual([])
    expect(result.migrated).toEqual([])
    expect(result.errors.map(e => e.message)).toEqual(['down'])
    expect(client.save).not.toHaveBeenCalled()
  })
})

describe('createRagIndexTriggers', () => {
  it('creates the missing triggers and launches the files one', async () => {
    const { client, triggersCollection } = makeClient()
    await expect(createRagIndexTriggers(client)).resolves.toEqual([
      ASSISTANTS,
      FILES
    ])
    expect(client.save).toHaveBeenCalledTimes(2)
    expect(triggersCollection.launch).toHaveBeenCalledTimes(1)
  })

  it('creates nothing when both triggers exist', async () => {
    const { client, triggersCollection } = makeClient({
      triggers: [filesTrigger, assistantsTrigger]
    })
    await expect(createRagIndexTriggers(client)).resolves.toEqual([])
    expect(client.save).not.toHaveBeenCalled()
    expect(triggersCollection.launch).not.toHaveBeenCalled()
    expect(client.query).toHaveBeenCalledTimes(1)
  })

  it('removes the duplicates a concurrent session created meanwhile', async () => {
    const { client } = makeClient()
    const ours = {
      ...filesTrigger,
      _id: 'created-io.cozy.files'
    }
    const theirs = { ...filesTrigger, _id: 'a-trigger-files' }
    client.query
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [ours, theirs, assistantsTrigger] })
    await expect(createRagIndexTriggers(client)).resolves.toEqual([
      ASSISTANTS,
      FILES
    ])
    expect(client.destroy).toHaveBeenCalledTimes(1)
    expect(client.destroy).toHaveBeenCalledWith(ours)
  })

  it('logs a failed deduplication and still reports the triggers', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { client } = makeClient()
    client.query
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(new Error('down'))
    await expect(createRagIndexTriggers(client)).resolves.toEqual([
      ASSISTANTS,
      FILES
    ])
    expect(warn).toHaveBeenCalledWith(
      'cozy-search rag indexing:',
      'cannot remove the duplicate rag-index triggers',
      expect.any(Error)
    )
    warn.mockRestore()
  })
})

describe('fetchAssistants', () => {
  it('lists every assistant', async () => {
    const assistants = [{ _id: 'a' }, { _id: 'b' }]
    const { client } = makeClient({ assistants })
    await expect(fetchAssistants(client)).resolves.toEqual(assistants)
    expect(client.queryAll).toHaveBeenCalledTimes(1)
  })
})

describe('migrateAssistantsWithoutFolder with the assistants given', () => {
  it('does not query them again', async () => {
    const { client } = makeClient()
    const assistants = [
      { _id: 'bare', _type: ASSISTANTS },
      {
        _id: 'ok',
        _type: ASSISTANTS,
        knowledgeBase: [{ doctype: FILES, dirId: 'dir-1' }]
      }
    ]
    await expect(
      migrateAssistantsWithoutFolder(client, assistants)
    ).resolves.toEqual(['bare'])
    expect(client.queryAll).not.toHaveBeenCalled()
    expect(client.save).toHaveBeenCalledTimes(1)
  })
})
