import { useCallback } from 'react'

import { useClient } from 'cozy-client'
import flag from 'cozy-flags'

import { useFetchDocumentPath } from './useFetchDocumentPath'
import { useResolveRecipients } from './useResolveRecipients'
import { useSharingContext } from './useSharingContext'
import { getSharingDocIds } from '../state'

/**
 * Gives what is needed to change the permission type of the members
 * of a document's sharing
 *
 * @param {object} document - Shared document
 * @returns {{ isInsideSharedParent: boolean, sharedParentName: string|null, setMemberType: Function }}
 * `setMemberType({ sharingId, memberIndex, type, recipient }, newType, { withAncestors })`
 * also downgrades the member on the read-write ancestor sharings when `withAncestors` is set
 */
export const useMemberPermissionType = document => {
  const client = useClient()
  const {
    hasSharedParent,
    getSharedParentPath,
    updateSharingMemberType,
    getSharingById,
    share
  } = useSharingContext()
  const resolveRecipients = useResolveRecipients()

  const documentPath = useFetchDocumentPath(client, document)
  const isInsideSharedParent =
    Boolean(documentPath) && Boolean(hasSharedParent?.(documentPath))
  const sharedParentPath = documentPath
    ? getSharedParentPath?.(documentPath)
    : null

  const setMemberType = useCallback(
    async (
      { sharingId, memberIndex, type, recipient },
      newType,
      { withAncestors = false } = {}
    ) => {
      if (withAncestors) {
        // Ancestors first: only the target's own update refetches its
        // effective recipients, which must already see them downgraded.
        const ancestors = (recipient?.sources || []).filter(
          s => s.kind === 'ancestor' && !s.read_only
        )
        for (const ancestor of ancestors) {
          await updateSharingMemberType(
            ancestor.sharing_id,
            ancestor.member_index,
            newType
          )
        }
      }

      const documentId = document?._id || document?.id
      if (
        flag('drive.federated-shared-folder.enabled') &&
        type === 'one-way' &&
        newType === 'two-way' &&
        documentId
      ) {
        const sourceSharing = getSharingById(sharingId)
        if (
          sourceSharing &&
          !getSharingDocIds(sourceSharing).includes(documentId)
        ) {
          const { recipients } = await resolveRecipients([recipient])
          if (!recipients[0]) throw new Error('Recipient contact not found')
          await share({
            document: { ...document, id: documentId },
            description: document.name,
            recipients,
            readOnlyRecipients: [],
            sharedDrive: true,
            openSharing: false
          })
          return
        }
      }

      await updateSharingMemberType(sharingId, memberIndex, newType, document)
    },
    [
      document,
      getSharingById,
      resolveRecipients,
      share,
      updateSharingMemberType
    ]
  )

  return {
    isInsideSharedParent,
    sharedParentName: sharedParentPath?.split('/').pop() ?? null,
    setMemberType
  }
}
