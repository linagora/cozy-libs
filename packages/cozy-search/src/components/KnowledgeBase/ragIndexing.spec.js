import { Q } from 'cozy-client'

import { ROOT_DIR_ID } from './knowledgeBase'
import {
  RAG_INDEX_FILES_DEBOUNCE,
  findRagIndexTriggers,
  makeRagIndexTriggerAttributes,
  migrateAssistantsWithoutFolder,
  setupRagIndexing
} from './ragIndexing'

const FILES = 'io.cozy.files'
const ASSISTANTS = 'io.cozy.ai.chat.assistants'

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

const makeClient = ({ triggers = [], assistants = [] } = {}) => {
  const triggersCollection = {
    find: jest.fn().mockResolvedValue({ data: triggers }),
    create: jest.fn(async attributes => ({
      data: { _id: `created-${attributes.arguments}`, ...attributes }
    })),
    launch: jest.fn().mockResolvedValue({ data: { _id: 'job-1' } })
  }
  const client = {
    collection: jest.fn(doctype => {
      if (doctype === 'io.cozy.triggers') return triggersCollection
      throw new Error(`unexpected collection ${doctype}`)
    }),
    queryAll: jest.fn(async () => assistants),
    save: jest.fn(async doc => ({ data: doc }))
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
    const { client, triggersCollection } = makeClient({
      triggers: [filesTrigger, assistantsTrigger]
    })
    const found = await findRagIndexTriggers(client)
    expect(triggersCollection.find).toHaveBeenCalledWith({
      worker: 'rag-index'
    })
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

    expect(triggersCollection.create).toHaveBeenCalledTimes(1)
    expect(triggersCollection.create).toHaveBeenCalledWith(
      makeRagIndexTriggerAttributes(FILES)
    )
    expect(triggersCollection.launch).toHaveBeenCalledTimes(1)
    expect(triggersCollection.launch.mock.calls[0][0]._id).toBe(
      'created-io.cozy.files'
    )
    expect(result).toEqual({ triggers: [FILES], migrated: [], errors: [] })
  })

  it('creates the files trigger when the existing one is not an @event trigger', async () => {
    const { client, triggersCollection } = makeClient({
      triggers: [cronFilesTrigger, assistantsTrigger]
    })
    const result = await setupRagIndexing(client)

    expect(triggersCollection.create).toHaveBeenCalledWith(
      makeRagIndexTriggerAttributes(FILES)
    )
    expect(result.triggers).toEqual([FILES])
  })

  it('creates the assistants trigger without launching it', async () => {
    const { client, triggersCollection } = makeClient({
      triggers: [filesTrigger]
    })
    const result = await setupRagIndexing(client)
    expect(triggersCollection.create).toHaveBeenCalledWith(
      makeRagIndexTriggerAttributes(ASSISTANTS)
    )
    expect(triggersCollection.launch).not.toHaveBeenCalled()
    expect(result.triggers).toEqual([ASSISTANTS])
  })

  it('touches nothing when both triggers exist', async () => {
    const { client, triggersCollection } = makeClient({
      triggers: [filesTrigger, assistantsTrigger]
    })
    const result = await setupRagIndexing(client)
    expect(triggersCollection.create).not.toHaveBeenCalled()
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
    const { client, triggersCollection } = makeClient({
      assistants: [{ _id: 'a1', _type: ASSISTANTS }]
    })
    triggersCollection.create.mockRejectedValue(
      Object.assign(new Error('forbidden'), { status: 403 })
    )
    const result = await setupRagIndexing(client)
    expect(result.triggers).toEqual([])
    // The first failing creation aborts the trigger setup: one error.
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].status).toBe(403)
    expect(result.migrated).toEqual(['a1'])
    expect(warn).toHaveBeenCalled()
  })

  it('never throws, even when the listing fails', async () => {
    const { client, triggersCollection } = makeClient()
    triggersCollection.find.mockRejectedValue(new Error('down'))
    const result = await setupRagIndexing(client)
    expect(result.triggers).toEqual([])
    expect(result.migrated).toEqual([])
    expect(result.errors.map(e => e.message)).toEqual(['down'])
    expect(triggersCollection.create).not.toHaveBeenCalled()
  })
})
