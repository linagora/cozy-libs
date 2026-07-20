import {
  makeKnowledgeBaseEntry,
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
})
