import React, { useCallback, useRef, useState } from 'react'

import { useClient } from 'cozy-client'
import flag from 'cozy-flags'
import minilog from 'cozy-minilog'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import DowngradePermissionConfirmDialog from './DowngradePermissionConfirmDialog'
import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'
import { getOrCreateFromArray } from '../../helpers/contacts'
import withLocales from '../../hoc/withLocales'
import { useFetchDocumentPath } from '../../hooks/useFetchDocumentPath'
import { useSharingContext } from '../../hooks/useSharingContext'
import { getSharingDocIds } from '../../state'

const log = minilog('PermissionTypeMenu')

const PermissionTypeMenuComponent = ({
  sharingId,
  memberIndex,
  type,
  document,
  recipient
}) => {
  const { t } = useI18n()
  const client = useClient()
  const buttonRef = useRef()
  const { hasSharedParent, updateSharingMemberType, getSharingById, share } =
    useSharingContext()
  const { showAlert } = useAlert()

  const [isMenuDisplayed, setMenuDisplayed] = useState(false)
  const [pendingType, setPendingType] = useState(null)

  const documentPath = useFetchDocumentPath(client, document)

  const hideMenu = useCallback(() => {
    setMenuDisplayed(false)
  }, [])

  const applyType = useCallback(
    async newType => {
      try {
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
            const contacts = await getOrCreateFromArray(
              client,
              [recipient],
              contact => client.create('io.cozy.contacts', contact)
            )
            if (!contacts[0]) throw new Error('Recipient contact not found')
            await share({
              document: { ...document, id: documentId },
              description: document.name,
              recipients: contacts,
              readOnlyRecipients: [],
              sharedDrive: true,
              openSharing: false
            })
            return
          }
        }
        await updateSharingMemberType(sharingId, memberIndex, newType)
      } catch (error) {
        log.error('Failed to change member permission type', error)
        showAlert({
          message: t('Share.members.error.changePermission'),
          severity: 'error',
          variant: 'filled'
        })
      }
    },
    [
      client,
      document,
      getSharingById,
      memberIndex,
      recipient,
      share,
      sharingId,
      showAlert,
      t,
      type,
      updateSharingMemberType
    ]
  )

  // Downgrading to viewer on a folder inside a shared parent also reduces
  // the member's rights on the parent: require explicit confirmation first.
  const shouldConfirmDowngrade =
    type === 'two-way' &&
    Boolean(documentPath) &&
    hasSharedParent?.(documentPath)

  const setType = useCallback(
    newType => {
      hideMenu()
      if (newType === type) return
      if (newType === 'one-way' && shouldConfirmDowngrade) {
        setPendingType(newType)
        return
      }
      applyType(newType)
    },
    [applyType, hideMenu, shouldConfirmDowngrade, type]
  )

  const handleConfirmDowngrade = useCallback(() => {
    const newType = pendingType
    setPendingType(null)
    if (newType) applyType(newType)
  }, [applyType, pendingType])

  const handleCancelDowngrade = useCallback(() => {
    setPendingType(null)
  }, [])

  const actions = makeActions(
    [setReadOnlySharedPermission, setReadWriteSharedPermission],
    {
      t,
      type: type ?? 'one-way',
      setType
    }
  )

  return (
    <>
      <DropdownButton
        ref={buttonRef}
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={() => setMenuDisplayed(true)}
        textVariant="body2"
      >
        {t(`Share.type.${type}`)}
      </DropdownButton>
      <ActionsMenu
        ref={buttonRef}
        open={isMenuDisplayed}
        actions={actions}
        autoClose
        onClose={hideMenu}
      />
      {pendingType && (
        <DowngradePermissionConfirmDialog
          document={document}
          recipient={recipient}
          onCancel={handleCancelDowngrade}
          onConfirm={handleConfirmDowngrade}
        />
      )}
    </>
  )
}

export const PermissionTypeMenu = withLocales(PermissionTypeMenuComponent)
