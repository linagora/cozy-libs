import PropTypes from 'prop-types'
import React from 'react'

import { getPrimaryCozy } from 'cozy-client/dist/models/contact'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { useI18n } from 'twake-i18n'

import { Contact, Group, getDisplayName } from '../models'
import { GroupAvatar } from './Avatar/GroupAvatar'
import { MemberAvatar } from './Avatar/MemberAvatar'

export const ContactSuggestion = ({ contactOrGroup }) => {
  const { t } = useI18n()

  if (contactOrGroup._type === Group.doctype) {
    return (
      <ListItem button>
        <ListItemIcon>
          <GroupAvatar size="m" color={contactOrGroup.color} />
        </ListItemIcon>
        <ListItemText
          primary={contactOrGroup.name}
          secondary={t('Share.members.count', {
            smart_count: contactOrGroup.members.length.toString()
          })}
        />
      </ListItem>
    )
  }

  const name = getDisplayName(contactOrGroup)
  const cozyUrl = getPrimaryCozy(contactOrGroup)

  return (
    <ListItem button>
      <ListItemIcon>
        <MemberAvatar recipient={contactOrGroup} size="m" />
      </ListItemIcon>
      <ListItemText primary={name} secondary={cozyUrl || '-'} />
    </ListItem>
  )
}

const newUnknownContactProptypes = PropTypes.shape({
  _type: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired
})

ContactSuggestion.propTypes = {
  contactOrGroup: PropTypes.oneOfType([
    Contact.propType,
    Group.propType,
    newUnknownContactProptypes
  ]).isRequired,
  contacts: PropTypes.arrayOf(Contact.propType)
}

export default ContactSuggestion
