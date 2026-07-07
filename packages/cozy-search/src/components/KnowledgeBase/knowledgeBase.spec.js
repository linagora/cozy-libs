import {
  makeKnowledgeBaseEntry,
  getKnowledgeBaseFolderId,
  saveKnowledgeBase
} from './knowledgeBase'

describe('makeKnowledgeBaseEntry', () => {
  it('builds an io.cozy.files entry from a picked folder', () => {
    expect(makeKnowledgeBaseEntry({ id: 'folder-1', name: 'HR' })).toEqual({
      doctype: 'io.cozy.files',
      folderId: 'folder-1'
    })
  })
})

describe('getKnowledgeBaseFolderId', () => {
  it('returns the folderId of the io.cozy.files entry', () => {
    const assistant = {
      knowledgeBase: [{ doctype: 'io.cozy.files', folderId: 'folder-1' }]
    }
    expect(getKnowledgeBaseFolderId(assistant)).toBe('folder-1')
  })

  it('ignores entries of other doctypes', () => {
    const assistant = {
      knowledgeBase: [
        { doctype: 'com.linagora.email', mailboxId: 'inbox' },
        { doctype: 'io.cozy.files', folderId: 'folder-2' }
      ]
    }
    expect(getKnowledgeBaseFolderId(assistant)).toBe('folder-2')
  })

  it('returns null when there is no knowledge base', () => {
    expect(getKnowledgeBaseFolderId({})).toBeNull()
    expect(getKnowledgeBaseFolderId(undefined)).toBeNull()
    expect(getKnowledgeBaseFolderId({ knowledgeBase: [] })).toBeNull()
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
    const knowledgeBase = [{ doctype: 'io.cozy.files', folderId: 'folder-1' }]

    await saveKnowledgeBase(client, 'assistant-1', knowledgeBase)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.save).toHaveBeenCalledWith({
      ...assistantDoc,
      knowledgeBase
    })
  })
})
