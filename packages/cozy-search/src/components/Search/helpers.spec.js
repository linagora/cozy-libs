import { groupConversationsByDate } from './helpers'

describe('groupConversationsByDate', () => {
  let OriginalDate

  beforeEach(() => {
    OriginalDate = global.Date
    global.Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length) return new OriginalDate(...args)
        return new OriginalDate('2023-11-20T12:00:00Z')
      }
    }
    global.Date.now = jest.fn(() =>
      new OriginalDate('2023-11-20T12:00:00Z').getTime()
    )
  })

  afterEach(() => {
    global.Date = OriginalDate
  })

  it('returns an empty array for null or undefined input', () => {
    expect(groupConversationsByDate(null)).toEqual([])
    expect(groupConversationsByDate(undefined)).toEqual([])
    expect(groupConversationsByDate([])).toEqual([])
  })

  it('groups conversations by calendar day, descending', () => {
    const mockConversations = [
      {
        id: '1',
        cozyMetadata: {
          updatedAt: new OriginalDate(2023, 10, 20, 14, 0).toISOString()
        }
      }, // today
      {
        id: '2',
        cozyMetadata: {
          updatedAt: new OriginalDate(2023, 10, 20, 8, 0).toISOString()
        }
      }, // today
      {
        id: '3',
        cozyMetadata: {
          updatedAt: new OriginalDate(2023, 10, 19, 23, 59).toISOString()
        }
      }, // yesterday
      {
        id: '4',
        cozyMetadata: {
          updatedAt: new OriginalDate(2022, 0, 1, 12, 0).toISOString()
        }
      }, // older
      { id: '5' } // missing metadata — bucketed under today via Date.now fallback
    ]

    const result = groupConversationsByDate(mockConversations)

    expect(result).toHaveLength(3)

    expect(result[0].key).toBe('today')
    expect(result[0].items.map(c => c.id)).toEqual(['1', '2', '5'])

    expect(result[1].key).toBe('yesterday')
    expect(result[1].items.map(c => c.id)).toEqual(['3'])

    expect(result[2].key).toBe('date')
    expect(result[2].items.map(c => c.id)).toEqual(['4'])
  })
})
