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

  it('returns empty groups for null or undefined input', () => {
    expect(groupConversationsByDate(null)).toEqual({ today: [], older: [] })
    expect(groupConversationsByDate(undefined)).toEqual({
      today: [],
      older: []
    })
  })

  it('groups conversations into today and older', () => {
    const mockConversations = [
      {
        id: '1',
        cozyMetadata: {
          updatedAt: new OriginalDate(2023, 10, 20, 14, 0).toISOString()
        }
      }, // Today
      {
        id: '2',
        cozyMetadata: {
          updatedAt: new OriginalDate(2023, 10, 20, 8, 0).toISOString()
        }
      }, // Today
      {
        id: '3',
        cozyMetadata: {
          updatedAt: new OriginalDate(2023, 10, 19, 23, 59).toISOString()
        }
      }, // Older
      {
        id: '4',
        cozyMetadata: {
          updatedAt: new OriginalDate(2022, 0, 1, 12, 0).toISOString()
        }
      }, // Older
      { id: '5' } // Missing cozyMetadata (Date.now() fallback -> Today)
    ]

    const result = groupConversationsByDate(mockConversations)

    expect(result.today).toHaveLength(3)
    expect(result.today[0].id).toBe('1')
    expect(result.today[1].id).toBe('2')
    expect(result.today[2].id).toBe('5')

    expect(result.older).toHaveLength(2)
    expect(result.older[0].id).toBe('3')
    expect(result.older[1].id).toBe('4')
  })
})
