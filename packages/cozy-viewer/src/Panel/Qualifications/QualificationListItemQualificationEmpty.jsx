import { Icon, LabelOutlined, Right } from '@linagora/twake-icons'
import PropTypes from 'prop-types'
import React from 'react'

import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import { withViewerLocales } from '../../hoc/withViewerLocales'
import { canEditQualification } from '../helpers'

const QualificationListItemQualificationEmpty = ({
  file,
  isReadOnly,
  t,
  onClick
}) => {
  return (
    <List>
      <ListItem
        button={canEditQualification(file, isReadOnly)}
        onClick={canEditQualification(file, isReadOnly) ? onClick : undefined}
      >
        <ListItemIcon>
          <Icon icon={LabelOutlined} />
        </ListItemIcon>
        <ListItemText
          style={{ color: 'var(--disabledTextColor)' }}
          primaryTypographyProps={{ color: 'inherit' }}
          secondaryTypographyProps={{ color: 'inherit' }}
          primary={t('Viewer.panel.qualification.empty.primary')}
          secondary={t('Viewer.panel.qualification.empty.secondary')}
        />
        {canEditQualification(file, isReadOnly) && (
          <ListItemIcon>
            <Icon icon={Right} color="var(--secondaryTextColor)" />
          </ListItemIcon>
        )}
      </ListItem>
    </List>
  )
}

QualificationListItemQualificationEmpty.propTypes = {
  onClick: PropTypes.func
}

export default withViewerLocales(QualificationListItemQualificationEmpty)
