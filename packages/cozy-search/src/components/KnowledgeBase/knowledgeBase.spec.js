import {
  makeKnowledgeBaseEntry,
  makeEmailKnowledgeBaseEntry,
  hasEmailKnowledgeBase,
  withKnowledgeBaseEntry,
  withoutKnowledgeBaseDoctype,
  getKnowledgeBaseDirId,
  ROOT_DIR_ID,
  isRootDirId,
  withRootFolderIfMissing,
  saveKnowledgeBase
} from './knowledgeBase'

describe('makeKnowledgeBaseEntry', () => {
  it('builds an io.cozy.files entry from a picked folder', () => {
    expect(makeKnowledgeBaseEntry({ id: 'folder-1', name: 'HR' })).toEqual({
      doctype: 'io.cozy.files',
      dirId: 'folder-1'
    })
  })
})

describe('makeEmailKnowledgeBaseEntry', () => {
  it('builds an all-or-nothing email entry', () => {
    expect(makeEmailKnowledgeBaseEntry()).toEqual({
      doctype: 'com.linagora.email'
    })
  })
})

describe('hasEmailKnowledgeBase', () => {
  it('detects the email entry', () => {
    expect(
      hasEmailKnowledgeBase({
        knowledgeBase: [{ doctype: 'com.linagora.email' }]
      })
    ).toBe(true)
  })

  it('returns false when there is no email entry', () => {
    expect(hasEmailKnowledgeBase(undefined)).toBe(false)
    expect(hasEmailKnowledgeBase({})).toBe(false)
    expect(
      hasEmailKnowledgeBase({
        knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'folder-1' }]
      })
    ).toBe(false)
  })
})

describe('withKnowledgeBaseEntry', () => {
  it('adds an entry and preserves entries of other doctypes', () => {
    expect(
      withKnowledgeBaseEntry([{ doctype: 'com.linagora.email' }], {
        doctype: 'io.cozy.files',
        dirId: 'folder-1'
      })
    ).toEqual([
      { doctype: 'com.linagora.email' },
      { doctype: 'io.cozy.files', dirId: 'folder-1' }
    ])
  })

  it('replaces an existing entry of the same doctype', () => {
    expect(
      withKnowledgeBaseEntry(
        [
          { doctype: 'io.cozy.files', dirId: 'folder-1' },
          { doctype: 'com.linagora.email' }
        ],
        { doctype: 'io.cozy.files', dirId: 'folder-2' }
      )
    ).toEqual([
      { doctype: 'com.linagora.email' },
      { doctype: 'io.cozy.files', dirId: 'folder-2' }
    ])
  })

  it('works from an undefined knowledge base', () => {
    expect(
      withKnowledgeBaseEntry(undefined, { doctype: 'com.linagora.email' })
    ).toEqual([{ doctype: 'com.linagora.email' }])
  })
})

describe('withoutKnowledgeBaseDoctype', () => {
  it('removes only the entries of the given doctype', () => {
    expect(
      withoutKnowledgeBaseDoctype(
        [
          { doctype: 'io.cozy.files', dirId: 'folder-1' },
          { doctype: 'com.linagora.email' }
        ],
        'com.linagora.email'
      )
    ).toEqual([{ doctype: 'io.cozy.files', dirId: 'folder-1' }])
  })

  it('works from an undefined knowledge base', () => {
    expect(
      withoutKnowledgeBaseDoctype(undefined, 'com.linagora.email')
    ).toEqual([])
  })
})

describe('getKnowledgeBaseDirId', () => {
  it('returns the dirId of the io.cozy.files entry', () => {
    const assistant = {
      knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'folder-1' }]
    }
    expect(getKnowledgeBaseDirId(assistant)).toBe('folder-1')
  })

  it('ignores entries of other doctypes', () => {
    const assistant = {
      knowledgeBase: [
        { doctype: 'com.linagora.email', mailboxId: 'inbox' },
        { doctype: 'io.cozy.files', dirId: 'folder-2' }
      ]
    }
    expect(getKnowledgeBaseDirId(assistant)).toBe('folder-2')
  })

  it('returns null when there is no knowledge base', () => {
    expect(getKnowledgeBaseDirId({})).toBeNull()
    expect(getKnowledgeBaseDirId(undefined)).toBeNull()
    expect(getKnowledgeBaseDirId({ knowledgeBase: [] })).toBeNull()
  })
})

describe('withRootFolderIfMissing', () => {
  it('appends the root entry when there is no files entry', () => {
    expect(withRootFolderIfMissing([{ doctype: 'io.cozy.email' }])).toEqual([
      { doctype: 'io.cozy.email' },
      { doctype: 'io.cozy.files', dirId: ROOT_DIR_ID }
    ])
    expect(withRootFolderIfMissing()).toEqual([
      { doctype: 'io.cozy.files', dirId: ROOT_DIR_ID }
    ])
  })

  it('returns the same array when a files entry exists', () => {
    const kb = [{ doctype: 'io.cozy.files', dirId: 'folder-1' }]
    expect(withRootFolderIfMissing(kb)).toBe(kb)
  })

  it('does not count a files entry without dirId', () => {
    expect(withRootFolderIfMissing([{ doctype: 'io.cozy.files' }])).toEqual([
      { doctype: 'io.cozy.files' },
      { doctype: 'io.cozy.files', dirId: ROOT_DIR_ID }
    ])
  })
})

describe('isRootDirId', () => {
  it('recognizes the root folder id only', () => {
    expect(isRootDirId(ROOT_DIR_ID)).toBe(true)
    expect(isRootDirId('folder-1')).toBe(false)
    expect(isRootDirId(null)).toBe(false)
  })
})

describe('saveKnowledgeBase', () => {
  it('refetches the assistant and saves it with the new knowledgeBase', async () => {
    const assistantDoc = {
      _id: 'assistant-1',
      _type: 'io.cozy.ai.chat.assistants',
      name: 'My assistant'
    }
    const client = {
      query: jest.fn().mockResolvedValue({ data: assistantDoc }),
      save: jest.fn().mockResolvedValue({ data: assistantDoc })
    }
    const knowledgeBase = [{ doctype: 'io.cozy.files', dirId: 'folder-1' }]

    await saveKnowledgeBase(client, 'assistant-1', knowledgeBase)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.save).toHaveBeenCalledWith({
      ...assistantDoc,
      knowledgeBase
    })
  })

  it('applies an updater function to the freshly fetched knowledgeBase', async () => {
    const assistantDoc = {
      _id: 'assistant-1',
      _type: 'io.cozy.ai.chat.assistants',
      name: 'My assistant',
      knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'fresh-folder' }]
    }
    const client = {
      query: jest.fn().mockResolvedValue({ data: assistantDoc }),
      save: jest.fn().mockResolvedValue({ data: assistantDoc })
    }
    const updater = jest.fn(kb =>
      withKnowledgeBaseEntry(kb, makeEmailKnowledgeBaseEntry())
    )

    await saveKnowledgeBase(client, 'assistant-1', updater)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(updater).toHaveBeenCalledWith(assistantDoc.knowledgeBase)
    expect(client.save).toHaveBeenCalledWith({
      ...assistantDoc,
      knowledgeBase: [
        { doctype: 'io.cozy.files', dirId: 'fresh-folder' },
        { doctype: 'com.linagora.email' }
      ]
    })
  })

  it('saves the root entry when the knowledge base has no folder', async () => {
    const assistantDoc = {
      _id: 'assistant-1',
      _type: 'io.cozy.ai.chat.assistants'
    }
    const client = {
      query: jest.fn().mockResolvedValue({ data: assistantDoc }),
      save: jest.fn().mockResolvedValue({ data: assistantDoc })
    }

    await saveKnowledgeBase(client, 'assistant-1', [
      { doctype: 'io.cozy.email' }
    ])

    expect(client.save).toHaveBeenCalledWith({
      ...assistantDoc,
      knowledgeBase: [
        { doctype: 'io.cozy.email' },
        { doctype: 'io.cozy.files', dirId: ROOT_DIR_ID }
      ]
    })
  })

  it('applies the root invariant to the updater result too', async () => {
    const assistantDoc = {
      _id: 'assistant-1',
      _type: 'io.cozy.ai.chat.assistants',
      knowledgeBase: [{ doctype: 'io.cozy.files', dirId: 'folder-1' }]
    }
    const client = {
      query: jest.fn().mockResolvedValue({ data: assistantDoc }),
      save: jest.fn().mockResolvedValue({ data: assistantDoc })
    }

    await saveKnowledgeBase(client, 'assistant-1', () => [])

    expect(client.save).toHaveBeenCalledWith({
      ...assistantDoc,
      knowledgeBase: [{ doctype: 'io.cozy.files', dirId: ROOT_DIR_ID }]
    })
  })

  it('propagates a save failure', async () => {
    const client = {
      query: jest.fn().mockResolvedValue({ data: { _id: 'assistant-1' } }),
      save: jest.fn().mockRejectedValue(new Error('boom'))
    }
    await expect(saveKnowledgeBase(client, 'assistant-1', [])).rejects.toThrow(
      'boom'
    )
  })
})
