import {
  mergeAndDeduplicateRecipients,
  moveRecipientToReadWrite,
  moveRecipientToReadOnly,
  formatRecipients,
  RECIPIENT_INDEX_PREFIX
} from './helpers'

describe('mergeAndDeduplicateRecipients', () => {
  it('should merge multiple arrays into one', () => {
    const result = mergeAndDeduplicateRecipients([
      [{ id: '1', name: 'Alice' }],
      [{ id: '2', name: 'Bob' }]
    ])
    expect(result).toEqual([
      { id: '1', _id: '1', name: 'Alice' },
      { id: '2', _id: '2', name: 'Bob' }
    ])
  })

  it('should deduplicate recipients with the same id', () => {
    const result = mergeAndDeduplicateRecipients([
      [{ id: '1', name: 'Alice' }],
      [{ id: '1', name: 'Alice' }]
    ])
    expect(result).toEqual([{ id: '1', _id: '1', name: 'Alice' }])
  })

  it('should normalize _id to id for deduplication', () => {
    const result = mergeAndDeduplicateRecipients([
      [{ _id: '1', name: 'Alice' }],
      [{ _id: '2', name: 'Bob' }]
    ])
    expect(result).toEqual([
      { _id: '1', id: '1', name: 'Alice' },
      { _id: '2', id: '2', name: 'Bob' }
    ])
  })

  it('should deduplicate recipients when one has id and the other has _id', () => {
    const result = mergeAndDeduplicateRecipients([
      [{ id: '1', name: 'Alice' }],
      [{ _id: '1', name: 'Alice' }]
    ])
    expect(result).toEqual([{ id: '1', _id: '1', name: 'Alice' }])
  })

  it('should prefer existing id over _id when both are present', () => {
    const result = mergeAndDeduplicateRecipients([
      [{ id: 'real-id', _id: 'other-id', name: 'Alice' }]
    ])
    expect(result).toEqual([{ id: 'real-id', _id: 'other-id', name: 'Alice' }])
  })

  it('should handle empty arrays', () => {
    const result = mergeAndDeduplicateRecipients([[], []])
    expect(result).toEqual([])
  })
})

describe('moveRecipientToReadWrite', () => {
  it('should move a recipient from readOnly to readWrite', () => {
    const state = {
      recipients: [{ _id: '1', name: 'Alice' }],
      readOnlyRecipients: [{ _id: '2', name: 'Bob' }]
    }
    const result = moveRecipientToReadWrite(state, '2')
    expect(result.recipients).toEqual([
      { _id: '1', name: 'Alice' },
      { _id: '2', name: 'Bob' }
    ])
    expect(result.readOnlyRecipients).toEqual([])
  })

  it('should return unchanged state if recipient not found', () => {
    const state = {
      recipients: [{ _id: '1', name: 'Alice' }],
      readOnlyRecipients: []
    }
    const result = moveRecipientToReadWrite(state, '999')
    expect(result).toBe(state)
  })
})

describe('moveRecipientToReadOnly', () => {
  it('should move a recipient from readWrite to readOnly', () => {
    const state = {
      recipients: [{ _id: '1', name: 'Alice' }],
      readOnlyRecipients: [{ _id: '2', name: 'Bob' }]
    }
    const result = moveRecipientToReadOnly(state, '1')
    expect(result.recipients).toEqual([])
    expect(result.readOnlyRecipients).toEqual([
      { _id: '2', name: 'Bob' },
      { _id: '1', name: 'Alice' }
    ])
  })

  it('should return unchanged state if recipient not found', () => {
    const state = {
      recipients: [],
      readOnlyRecipients: [{ _id: '1', name: 'Alice' }]
    }
    const result = moveRecipientToReadOnly(state, '999')
    expect(result).toBe(state)
  })
})

describe('formatRecipients', () => {
  it('should format readWrite and readOnly recipients with correct types', () => {
    const input = {
      recipients: [
        {
          _id: '1',
          displayName: 'Alice',
          email: [{ address: 'alice@example.com', primary: true }]
        }
      ],
      readOnlyRecipients: [
        {
          _id: '2',
          displayName: 'Bob',
          email: [{ address: 'bob@example.com', primary: true }]
        }
      ]
    }
    const result = formatRecipients(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      index: `${RECIPIENT_INDEX_PREFIX}1`,
      type: 'two-way',
      public_name: 'Alice'
    })
    expect(result[1]).toMatchObject({
      index: `${RECIPIENT_INDEX_PREFIX}2`,
      type: 'one-way',
      public_name: 'Bob'
    })
  })

  it('should sort recipients by public_name', () => {
    const input = {
      recipients: [
        {
          _id: '1',
          displayName: 'Zara',
          email: [{ address: 'zara@example.com', primary: true }]
        },
        {
          _id: '2',
          displayName: 'Alice',
          email: [{ address: 'alice@example.com', primary: true }]
        }
      ],
      readOnlyRecipients: []
    }
    const result = formatRecipients(input)
    expect(result[0].public_name).toBe('Alice')
    expect(result[1].public_name).toBe('Zara')
  })
})
