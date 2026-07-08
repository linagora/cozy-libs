import { markdownToProseMirror } from './markdownToProseMirror'

describe('markdownToProseMirror', () => {
  it('converts headings', () => {
    expect(markdownToProseMirror('# Title\n## Sub')).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Sub' }]
        }
      ]
    })
  })

  it('joins consecutive lines into one paragraph, splits on blank lines', () => {
    expect(markdownToProseMirror('line one\nline two\n\nsecond para')).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'line one line two' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'second para' }]
        }
      ]
    })
  })

  it('groups bullet lines into one bulletList', () => {
    expect(markdownToProseMirror('- a\n- b')).toEqual({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'a' }] }
              ]
            },
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'b' }] }
              ]
            }
          ]
        }
      ]
    })
  })

  it('handles mixed content in order', () => {
    const doc = markdownToProseMirror('# T\npara\n- x')
    expect(doc.content?.map(n => n.type)).toEqual([
      'heading',
      'paragraph',
      'bulletList'
    ])
  })

  it('returns a single empty paragraph for empty input', () => {
    expect(markdownToProseMirror('')).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }]
    })
  })
})
