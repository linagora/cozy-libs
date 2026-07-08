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
 * ProseMirror schema spec (OrderedMaps as arrays) sent with POST /notes.
 *
 * The cozy-notes editor renders content with the Atlaskit schema, whose node
 * names are camelCase (`bulletList`, `listItem`, …). Emitting the cozy-stack
 * doc example's snake_case names (`bullet_list`, `list_item`) creates a note
 * the stack accepts but the editor cannot display ("This editor does not
 * support displaying this content"). So we use Atlaskit-compatible names and
 * content models for exactly the nodes markdownToProseMirror emits.
 */
export const NOTES_SCHEMA = {
  nodes: [
    ['doc', { content: 'block+' }],
    ['paragraph', { content: 'inline*', group: 'block' }],
    [
      'heading',
      {
        content: 'inline*',
        group: 'block',
        attrs: { level: { default: 1 } }
      }
    ],
    ['text', { group: 'inline' }],
    [
      'orderedList',
      {
        content: 'listItem+',
        group: 'block',
        attrs: { order: { default: 1 } }
      }
    ],
    ['bulletList', { content: 'listItem+', group: 'block' }],
    ['listItem', { content: 'paragraph block*' }]
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
        type: 'bulletList',
        content: bulletItems.map(item => ({
          type: 'listItem',
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
