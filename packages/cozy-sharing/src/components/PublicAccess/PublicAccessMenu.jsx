import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { Icon, Trash } from '@linagora/twake-icons'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import ActionsMenuWrapper from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuWrapper'
import Divider from 'cozy-ui/transpiled/react/Divider'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Radios from 'cozy-ui/transpiled/react/Radios'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

const ONE_WAY = 'one-way'
const TWO_WAY = 'two-way'
const RESTRICTED = 'restricted'

const PublicAccessMenu = ({
  value,
  isViewerOnly = false,
  isBusy = false,
  onChange,
  onDeactivate
}) => {
  const { t } = useI18n()
  const [menuAnchor, setMenuAnchor] = useState(null)

  const isMenuDisplayed = menuAnchor !== null
  const isRestricted = value === RESTRICTED
  const types = isViewerOnly ? [ONE_WAY] : [ONE_WAY, TWO_WAY]
  const label = isRestricted
    ? t('Share.publicAccess.restricted')
    : t(`Share.type.${value}`)

  const handleTypeClick = type => {
    if (type !== value) onChange(type)
  }

  return (
    <>
      <DropdownButton
        aria-controls="simple-menu"
        aria-haspopup="true"
        textVariant="body2"
        disabled={isBusy}
        onClick={event => setMenuAnchor(event.currentTarget)}
      >
        {label}
      </DropdownButton>
      <ActionsMenuWrapper
        open={isMenuDisplayed}
        anchorEl={menuAnchor}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        keepMounted
        autoClose
        onClose={() => setMenuAnchor(null)}
      >
        {types.map(type => (
          <ActionsMenuItem key={type} onClick={() => handleTypeClick(type)}>
            <ListItemIcon>
              <Radios checked={type === value} />
            </ListItemIcon>
            <ListItemText primary={t(`Share.type.${type}`)} />
          </ActionsMenuItem>
        ))}
        {!isRestricted && <Divider className="u-mv-half" />}
        {!isRestricted && (
          <ActionsMenuItem onClick={onDeactivate}>
            <ListItemIcon>
              <Icon icon={Trash} color="var(--errorColor)" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography color="error">
                  {t('Share.permissionLink.deactivate')}
                </Typography>
              }
            />
          </ActionsMenuItem>
        )}
      </ActionsMenuWrapper>
    </>
  )
}

PublicAccessMenu.propTypes = {
  value: PropTypes.oneOf([RESTRICTED, ONE_WAY, TWO_WAY]).isRequired,
  isViewerOnly: PropTypes.bool,
  isBusy: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired
}

export default PublicAccessMenu
