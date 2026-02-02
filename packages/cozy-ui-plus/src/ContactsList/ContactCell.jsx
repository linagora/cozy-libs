import React from 'react'

import ActionsMenuButton from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuButton'

import ContactIdentity from './Contacts/ContactIdentity'

const Cell = ({ row, column, cell, actions, disable }) => {
  if (column.id === 'fullname') {
    return <ContactIdentity contact={row} disable={disable} noWrapper />
  }

  if (column.id === 'actions') {
    if (!actions) {
      return null
    }

    return <ActionsMenuButton docs={[row]} actions={actions} />
  }

  return cell
}

export default React.memo(Cell)
