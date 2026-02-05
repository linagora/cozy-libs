import React from 'react'

import List from 'cozy-ui/transpiled/react/List'

import ConversationListItem from './ConversationListItem'

const ConversationList = ({
  conversations,
  currentConversationId,
  disableAction,
  divider,
  onOpenConversation,
  ItemComponent = ConversationListItem
}) => {
  return (
    <List dense={false} className="u-w-100">
      {conversations?.map(conversation => (
        <ItemComponent
          key={conversation._id}
          disableAction={disableAction}
          conversation={conversation}
          selected={conversation._id === currentConversationId}
          onOpenConversation={onOpenConversation}
          divider={divider}
        />
      ))}
    </List>
  )
}

export default ConversationList
