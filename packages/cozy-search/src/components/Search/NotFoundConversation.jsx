import React from 'react'

import { Icon, Comment } from '@linagora/twake-icons'
import Avatar from 'cozy-ui/transpiled/react/Avatar'
import Empty from 'cozy-ui/transpiled/react/Empty'
import { alpha, useTheme } from 'cozy-ui/transpiled/react/styles'
import { useI18n } from 'twake-i18n'

const NotFoundConversation = () => {
  const { t } = useI18n()
  const theme = useTheme()

  return (
    <Empty
      className="u-h-100 u-bxz"
      icon={
        <Avatar
          size={64}
          color={alpha(
            theme.palette.primary.main,
            theme.palette.action.hoverOpacity
          )}
        >
          <Icon icon={Comment} color="var(--primaryColor)" size={32} />
        </Avatar>
      }
      title={t('assistant.search_conversation.not_found_title')}
      text={t('assistant.search_conversation.not_found_desc')}
      componentsProps={{ title: { variant: 'h4' } }}
    />
  )
}

export default NotFoundConversation
