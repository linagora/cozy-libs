import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from 'twake-i18n'

import { useQuery } from 'cozy-client'
import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import BurgerIcon from 'cozy-ui/transpiled/react/Icons/Burger'
import MagnifierIcon from 'cozy-ui/transpiled/react/Icons/Magnifier'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { makeConversationId } from '../helpers'
import { buildRecentConversationsQuery } from '../queries'
import styles from './styles.styl'

const ConversationList = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()

  const [visible, setVisible] = useState(true)

  const { conversationId } = useParams()

  const recentConvsQuery = buildRecentConversationsQuery()

  const goToConversation = conversationId => {
    const parts = location.pathname.split('/')
    const assistantIndex = parts.findIndex(part => part === 'assistant')

    if (assistantIndex !== -1 && parts.length > assistantIndex + 1) {
      parts[assistantIndex + 1] = conversationId
    } else {
      parts.push('assistant', conversationId)
    }
    const newPathname = parts.join('/')

    navigate({
      pathname: newPathname,
      search: location.search,
      hash: location.hash
    })
  }

  const createNewConversation = () => {
    const newConversationId = makeConversationId()
    goToConversation(newConversationId)
  }

  const { data: conversations } = useQuery(
    recentConvsQuery.definition,
    recentConvsQuery.options
  )

  return (
    <>
      <div
        className={`u-h-3 u-ph-1 u-flex u-flex-row u-flex-items-center u-flex-justify-start ${
          styles['menuToggler']
        }  ${
          visible
            ? styles['menuToggler--enabled'] + ' u-w-5 u-mw-5'
            : styles['menuToggler--disabled']
        }`}
      >
        <Button
          className="u-h-2 u-miw-1 u-mah-2 u-bdrs-4"
          size="small"
          label={<Icon icon={BurgerIcon} />}
          variant={visible ? 'ghost' : 'text'}
          onClick={() => setVisible(!visible)}
          color="text"
        />

        {visible && <div className="u-flex-auto" />}

        {flag('cozy.assistant.demo') && (
          <Button
            className="u-h-2 u-miw-1 u-mah-2 u-bdrs-4"
            size="small"
            label={<Icon icon={MagnifierIcon} />}
            variant="text"
            color="text"
          />
        )}
      </div>

      <div
        className={`u-w-5 u-mw-5 u-h-100 u-flex u-flex-column ${
          styles['conversationList']
        } ${
          visible
            ? styles['conversationList--visible']
            : styles['conversationList--hidden']
        }`}
      >
        <div
          style={{
            height: 46,
            minHeight: 46
          }}
        />

        <div className="u-p-1">
          <Button
            label={t('assistant.history.new')}
            variant="primary"
            startIcon={<Icon icon={PlusIcon} />}
            className="u-bdrs-6 u-w-100"
            onClick={() => createNewConversation()}
          />
        </div>

        <Typography
          className="u-ph-half u-mh-1 u-mv-half"
          variant="subtitle1"
          color="textSecondary"
        >
          {t('assistant.history.recent')}
        </Typography>

        <div className={`u-ph-half ${styles['conversationList--container']}`}>
          <List disabledGutters>
            {conversations &&
              conversations.map((conv, index) => (
                <ListItem
                  dense
                  button
                  className={`u-bdrs-4 ${
                    conv.id == conversationId
                      ? styles['conversationListItem--selected']
                      : ''
                  }`}
                  key={index}
                  onClick={() => goToConversation(conv.id)}
                >
                  <ListItemText>
                    <Typography variant="body2">
                      {conv.messages[conv.messages.length - 1]?.content}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                      {conv.messages[conv.messages.length - 1]?.content}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(conv.cozyMetadata?.updatedAt).toLocaleString()}
                    </Typography>
                  </ListItemText>
                </ListItem>
              ))}
          </List>
        </div>
      </div>
    </>
  )
}

export default ConversationList
