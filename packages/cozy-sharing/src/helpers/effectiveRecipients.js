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
 * Build a view object for the members list.
 * Extracts sharingId/memberIndex/avatarPath/type from the source so
 * existing components work without reading sources[] directly.
 * Does not spread the backend data — only the fields needed for rendering.
 */
const mapToRecipient = (effectiveRecipient, source, avatarSource) => ({
  id: effectiveRecipient.id,
  name: effectiveRecipient.name,
  email: effectiveRecipient.email,
  instance: effectiveRecipient.instance,
  status: effectiveRecipient.status,
  read_only: effectiveRecipient.read_only,
  index: `effective-${source.sharing_id}-${source.member_index}`,
  sharingId: source.sharing_id,
  memberIndex: source.member_index,
  avatarPath: `/sharings/${avatarSource.sharing_id}/recipients/${avatarSource.member_index}/avatar`,
  type: effectiveRecipient.read_only ? 'one-way' : 'two-way',
  sources: effectiveRecipient.sources
})

/**
 * In a shared drive the list comes from the owner's instance, but the avatar
 * is served by ours: only our copy of the drive's sharing is kept in sync
 * with the owner's member indexes, so prefer it when the member is in it.
 */
const getAvatarSource = (effectiveRecipient, driveId, bestSource) =>
  (driveId &&
    effectiveRecipient.sources?.find(s => s.sharing_id === driveId)) ||
  bestSource

export const mapEffectiveRecipients = (effectiveRecipients, driveId) =>
  (effectiveRecipients || []).map(recipient => {
    const source = getBestSource(recipient)
    return source
      ? mapToRecipient(
          recipient,
          source,
          getAvatarSource(recipient, driveId, source)
        )
      : recipient
  })
