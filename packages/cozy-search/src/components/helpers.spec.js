import {
  sanitizeChatContent,
  formatConversationDate,
  getNameOfConversation,
  getDescriptionOfConversation
} from './helpers'

jest.mock('cozy-flags', () => jest.fn(() => true), { virtual: true })

describe('sanitizeChatContent', () => {
  it('should return empty string for empty content', () => {
    expect(sanitizeChatContent('')).toBe('')
    expect(sanitizeChatContent(null)).toBe('')
    expect(sanitizeChatContent(undefined)).toBe('')
  })

  it('should return string if no special tags', () => {
    const text = 'How you doing, here no ref.'
    expect(sanitizeChatContent(text)).toBe(text)
  })

  it('should remove tags REF.../REF', () => {
    const text = 'Before REFdoc_1/REF after'
    expect(sanitizeChatContent(text)).toBe('Before after')
  })

  it('should remove tags [REF]...[/REF]', () => {
    const text = 'Before [REF]doc_1[/REF] after'
    expect(sanitizeChatContent(text)).toBe('Before after')
  })

  it('should remove mixed REF tags ', () => {
    const text = 'A REF.../REF B [REF]...[/REF] C REF.../REF D'
    expect(sanitizeChatContent(text)).toBe('A B C D')
  })

  it('should remove [tags]', () => {
    const text = 'Here is a doc [doc_42] and some texte'
    expect(sanitizeChatContent(text)).toBe('Here is a doc and some texte')
  })

  it('should not remove simple REF or [REF]', () => {
    const text = 'REF not closed [REF]not closed either'
    expect(sanitizeChatContent(text)).toBe(text)
  })
  it('should not remove lowercase ref', () => {
    const text = 'before refdoc_1/ref after'
    expect(sanitizeChatContent(text)).toBe(text)
  })
})

describe('formatConversationDate', () => {
  const mockT = jest.fn(key => key)
  const mockDate = new Date('2023-11-20T12:00:00Z')
  let OriginalDate
  let dateSpy

  beforeEach(() => {
    OriginalDate = global.Date
    dateSpy = jest.spyOn(global, 'Date').mockImplementation(function (...args) {
      if (args.length) {
        return new OriginalDate(...args)
      }
      return mockDate
    })
    dateSpy.now = jest.fn(() => mockDate.getTime())
  })

  afterEach(() => {
    dateSpy.mockRestore()
    mockT.mockClear()
  })

  it('returns empty string for invalid dates', () => {
    expect(formatConversationDate(null, mockT, 'en-US')).toBe('')
    expect(formatConversationDate('not date', mockT, 'en-US')).toBe('')
  })

  it('formats today as "Today, HH:mm"', () => {
    const today = new Date('2023-11-20T08:30:00Z').toISOString()
    const result = formatConversationDate(today, mockT, 'en-US')

    expect(result).toMatch(/assistant\.time\.today/)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('formats yesterday as "Yesterday, HH:mm"', () => {
    const yesterday = new Date('2023-11-19T14:45:00Z').toISOString()
    const result = formatConversationDate(yesterday, mockT, 'en-US')

    expect(result).toMatch(/assistant\.time\.yesterday/)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('formats older dates as formatted short date strings', () => {
    const older = new Date('2022-01-05T10:00:00Z').toISOString()
    const result = formatConversationDate(older, mockT, 'en-US')

    expect(result).toContain('2022')
    expect(result).toContain('Jan')
  })
})

describe('getNameOfConversation', () => {
  it('returns undefined if messages array is empty or missing', () => {
    expect(getNameOfConversation({})).toBeUndefined()
    expect(getNameOfConversation({ messages: [] })).toBeUndefined()
    expect(
      getNameOfConversation({ messages: [{ content: 'Hi' }] })
    ).toBeUndefined()
  })

  it('returns the content of the second to last message', () => {
    const convo = {
      messages: [
        { role: 'user', content: 'What is the sum?' },
        { role: 'assistant', content: 'It is 4' }
      ]
    }
    expect(getNameOfConversation(convo)).toBe('What is the sum?')
  })
})

describe('getDescriptionOfConversation', () => {
  it('returns undefined if messages array is empty or missing', () => {
    expect(getDescriptionOfConversation({})).toBeUndefined()
    expect(getDescriptionOfConversation({ messages: [] })).toBeUndefined()
  })

  it('returns the content of the last message', () => {
    const convo = {
      messages: [
        { role: 'user', content: 'What is the sum?' },
        { role: 'assistant', content: 'It is 4' }
      ]
    }
    expect(getDescriptionOfConversation(convo)).toBe('It is 4')
  })
})
