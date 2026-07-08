import { CAPABILITIES } from './capabilities'
import { extractActionJson } from './extractActionJson'

const createNote = CAPABILITIES[0] // id: create_note

const valid = {
  sentence: 'Sure — click the card to create the note.',
  action: 'create_note',
  params: { title: 'Summary', content: '# Points\n- one' }
}

describe('extractActionJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractActionJson(JSON.stringify(valid), createNote)).toEqual(valid)
  })

  it('parses JSON inside a fenced code block', () => {
    const raw = 'Here you go:\n```json\n' + JSON.stringify(valid) + '\n```'
    expect(extractActionJson(raw, createNote)).toEqual(valid)
  })

  it('parses JSON wrapped in prose', () => {
    const raw = 'Of course! ' + JSON.stringify(valid) + ' Let me know.'
    expect(extractActionJson(raw, createNote)).toEqual(valid)
  })

  it('rejects a mismatched action id', () => {
    const raw = JSON.stringify({ ...valid, action: 'create_event' })
    expect(extractActionJson(raw, createNote)).toBeNull()
  })

  it('rejects missing required params', () => {
    const raw = JSON.stringify({ ...valid, params: { title: 'Summary' } })
    expect(extractActionJson(raw, createNote)).toBeNull()
  })

  it('rejects empty required params', () => {
    const raw = JSON.stringify({
      ...valid,
      params: { title: ' ', content: 'x' }
    })
    expect(extractActionJson(raw, createNote)).toBeNull()
  })

  it('rejects an empty sentence', () => {
    const raw = JSON.stringify({ ...valid, sentence: '' })
    expect(extractActionJson(raw, createNote)).toBeNull()
  })

  it('returns null on garbage', () => {
    expect(extractActionJson('I cannot do that.', createNote)).toBeNull()
  })

  it('drops non-string extra params', () => {
    const raw = JSON.stringify({
      ...valid,
      params: { ...valid.params, count: 3 }
    })
    expect(extractActionJson(raw, createNote)).toEqual(valid)
  })
})
