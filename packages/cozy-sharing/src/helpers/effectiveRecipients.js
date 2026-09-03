/**
 * Pick the most relevant source for a recipient: prefer the target's own
 * share ("self"), fall back to the first ancestor source.
 * Needed because revoke/RO-RW actions target a specific sharing+member index.
 */
const getBestSource = effectiveRecipient => {
  const sources = effectiveRecipient.sources || []
  return sources.find(s => s.kind === 'self') || sources[0]
}

/**
 * Build a view object for MemberRecipient/MemberRecipientPermissions.
 * Extracts sharingId/memberIndex/avatarPath/type from the source so
 * existing components work without reading sources[] directly.
 * Does not spread the backend data — only the fields needed for rendering.
 */
const mapToRecipient = (effectiveRecipient, source) => ({
  name: effectiveRecipient.name,
  email: effectiveRecipient.email,
  instance: effectiveRecipient.instance,
  status: effectiveRecipient.status,
  read_only: effectiveRecipient.read_only,
  index: `effective-${source.sharing_id}-${source.member_index}`,
  sharingId: source.sharing_id,
  memberIndex: source.member_index,
  avatarPath: `/sharings/${source.sharing_id}/recipients/${source.member_index}/avatar`,
  type: effectiveRecipient.read_only ? 'one-way' : 'two-way'
})

export const mapEffectiveRecipients = effectiveRecipients =>
  (effectiveRecipients || []).map(recipient => {
    const source = getBestSource(recipient)
    return source ? mapToRecipient(recipient, source) : recipient
  })
