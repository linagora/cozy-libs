import { matchCapability } from './capabilities'

describe('matchCapability', () => {
  it.each([
    'Create a note summarizing this discussion',
    'write a note about the project',
    'Crée une note avec un résumé de cette discussion',
    'Rédige une note sur le budget'
  ])('detects create_note in "%s"', text => {
    expect(matchCapability(text)?.id).toBe('create_note')
  })

  it.each([
    'Schedule a meeting with Alice on Friday at 10am',
    'create an event for tomorrow',
    'Crée une réunion avec Bob vendredi',
    'Planifie une visio avec Alice demain',
    'ajoute un rendez-vous lundi à 9h'
  ])('detects create_event in "%s"', text => {
    expect(matchCapability(text)?.id).toBe('create_event')
  })

  it.each([
    'What is the weather like today?',
    'Summarize this document',
    'Quelle est ma dernière facture ?',
    'note', // object without a verb
    'meeting' // object without a verb
  ])('returns null for "%s"', text => {
    expect(matchCapability(text)).toBeNull()
  })

  it('prefers create_note when both objects appear', () => {
    // "note" is the more specific ask even if "meeting" is mentioned
    expect(matchCapability('Create a note about the meeting')?.id).toBe(
      'create_note'
    )
  })
})
