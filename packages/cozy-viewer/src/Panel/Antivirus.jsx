import PropTypes from 'prop-types'
import React, { useState } from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import InfoIcon from 'cozy-ui/transpiled/react/Icons/InfoOutlined'
import ShieldIcon from 'cozy-ui/transpiled/react/Icons/Shield'
import Link from 'cozy-ui/transpiled/react/Link'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Popover from 'cozy-ui/transpiled/react/Popover'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { getAntivirusStatus } from './helpers'
import { withViewerLocales } from '../hoc/withViewerLocales'

const Antivirus = ({ file, t }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleInfoClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  const { icon, text, isError } = getAntivirusStatus(file, t)

  if (!icon || !text) {
    return null
  }
  return (
    <List>
      <ListItem>
        <ListItemIcon>
          <Icon icon={icon} color={isError ? 'var(--errorColor)' : ''} />
        </ListItemIcon>
        <ListItemText>
          <Typography color={isError ? 'error' : 'default'}>{text}</Typography>
        </ListItemText>
        <ListItemIcon>
          <IconButton onClick={handleInfoClick} size="small">
            <Icon icon={InfoIcon} />
          </IconButton>
        </ListItemIcon>
      </ListItem>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <div className="u-p-1 u-flex u-maw-5">
          <div className="u-mr-half u-flex-shrink-0">
            <Icon icon={ShieldIcon} color="var(--primaryColor)" />
          </div>
          <div>
            <Typography variant="subtitle1" className="u-mb-half">
              <strong>{t('Viewer.panel.antivirus.info.title')}</strong>
            </Typography>
            <Typography variant="body2" className="u-mb-1">
              {t('Viewer.panel.antivirus.info.description')}
            </Typography>
            <div className="u-ta-right">
              <Link
                href="https://twake.app"
                target="_blank"
                rel="noopener noreferrer"
                color="primary"
              >
                {t('Viewer.panel.antivirus.info.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </Popover>
    </List>
  )
}

Antivirus.propTypes = {
  file: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired
}

export default withViewerLocales(Antivirus)
