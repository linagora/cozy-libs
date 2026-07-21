import React from 'react'

import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Empty from 'cozy-ui/transpiled/react/Empty'
import { useI18n } from 'twake-i18n'

import { GroupRecipientDetailWithAccess } from './GroupRecipientDetailWithAccess'
import { GroupRecipientDetailWithoutAccess } from './GroupRecipientDetailWithoutAccess'

const GroupRecipientDetail = ({ name, members, onClose, isOwner }) => {
  const { t } = useI18n()
  const withAccess = members.filter(
    member => !['revoked', 'mail-not-sent'].includes(member.status)
  )
  const withoutAccess = members.filter(member =>
    ['revoked', 'mail-not-sent'].includes(member.status)
  )

  return (
    <Dialog
      open
      size="small"
      onClose={onClose}
      title={name}
      content={
        <div className="u-flex u-stack-xs u-flex-column">
          {members.length === 0 ? (
            <Empty text={t('GroupRecipientDetail.empty.content')} />
          ) : null}
          {withAccess.length > 0 ? (
            <GroupRecipientDetailWithAccess withAccess={withAccess} />
          ) : null}
          {withoutAccess.length > 0 ? (
            <GroupRecipientDetailWithoutAccess
              withoutAccess={withoutAccess}
              isOwner={isOwner}
            />
          ) : null}
        </div>
      }
    />
  )
}

export { GroupRecipientDetail }
