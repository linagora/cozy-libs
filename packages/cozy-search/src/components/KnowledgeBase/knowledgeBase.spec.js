import {
  makeKnowledgeBaseEntry,
  makeEmailKnowledgeBaseEntry,
  hasEmailKnowledgeBase,
  withKnowledgeBaseEntry,
  withoutKnowledgeBaseDoctype,
  getKnowledgeBaseDirId,
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
})
