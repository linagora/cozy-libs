/**
 * Minimal Markdown → ProseMirror doc conversion for note creation.
 * Supports exactly what the side-call prompt asks the LLM to emit:
 * "#"/"##"… headings, plain paragraphs, "- " bullet lists.
 * Anything else degrades to plain paragraph text.
 */

export interface PmNode {
  type: string
  attrs?: Record<string, unknown>
  content?: PmNode[]
  text?: string
}

/**
 * The standard cozy-notes ProseMirror schema spec (OrderedMaps as arrays),
 * as documented in cozy-stack docs/notes.md. Required by POST /notes.
 */
export const NOTES_SCHEMA = {
  nodes: [
    ['doc', { content: 'block+' }],
    ['paragraph', { content: 'inline*', group: 'block' }],
    ['blockquote', { content: 'block+', group: 'block' }],
    ['horizontal_rule', { group: 'block' }],
    [
      'heading',
      {
        content: 'inline*',
        group: 'block',
        attrs: { level: { default: 1 } }
      }
    ],
    ['code_block', { content: 'text*', marks: '', group: 'block' }],
    ['text', { group: 'inline' }],
    [
      'image',
      {
        group: 'inline',
        inline: true,
        attrs: { alt: {}, src: {}, title: {} }
      }
    ],
    ['hard_break', { group: 'inline', inline: true }],
    [
      'ordered_list',
      {
        content: 'list_item+',
        group: 'block',
        attrs: { order: { default: 1 } }
      }
    ],
    ['bullet_list', { content: 'list_item+', group: 'block' }],
    ['list_item', { content: 'paragraph block*' }]
  ],
  marks: [
    ['link', { attrs: { href: {}, title: {} }, inclusive: false }],
    ['em', {}],
    ['strong', {}],
    ['code', {}]
  ],
  topNode: 'doc'
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/
const BULLET_RE = /^[-*]\s+(.+)$/

export const markdownToProseMirror = (markdown: string): PmNode => {
  const nodes: PmNode[] = []
  let paragraphLines: string[] = []
  let bulletItems: string[] = []

  const flushParagraph = (): void => {
    if (paragraphLines.length > 0) {
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: paragraphLines.join(' ') }]
      })
      paragraphLines = []
    }
  }

  const flushBullets = (): void => {
    if (bulletItems.length > 0) {
      nodes.push({
        type: 'bullet_list',
        content: bulletItems.map(item => ({
          type: 'list_item',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: item }]
            }
          ]
        }))
      })
      bulletItems = []
    }
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '') {
      flushParagraph()
      flushBullets()
      continue
    }
    const heading = HEADING_RE.exec(line)
    if (heading) {
      flushParagraph()
      flushBullets()
      nodes.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: [{ type: 'text', text: heading[2] }]
      })
      continue
    }
    const bullet = BULLET_RE.exec(line)
    if (bullet) {
      flushParagraph()
      bulletItems.push(bullet[1])
      continue
    }
    flushBullets()
    paragraphLines.push(line)
  }
  flushParagraph()
  flushBullets()

  if (nodes.length === 0) {
    // ProseMirror forbids empty text nodes; an empty doc is one bare paragraph
    nodes.push({ type: 'paragraph' })
  }
  return { type: 'doc', content: nodes }
}
