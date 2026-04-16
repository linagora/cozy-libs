import UserMenuContent from 'components/UserMenu/UserMenuContent'
import React, { useRef, useState } from 'react'

import { useInstanceInfo } from 'cozy-client'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Menu from 'cozy-ui/transpiled/react/Menu'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'

import AvatarMyself from './components/AvatarMyself'

const useStyles = makeStyles({
  root: {
    '& .dialogContentInner': {
      '& .dialogContentWrapper': {
        paddingBottom: '0 !important'
      }
    }
  }
})

const UserMenu = ({
  onLogOut,
  isSettingsAppInstalled,
  showEmailDomainChip
}) => {
  const [isOpen, setOpen] = useState(false)
  const containerRef = useRef()
  const buttonRef = useRef()

  const { isMobile } = useBreakpoints()

  const { isLoaded, instance, diskUsage } = useInstanceInfo()

  const toggleMenu = () => {
    setOpen(!isOpen)
  }

  const styles = useStyles()

  return (
    <nav ref={containerRef}>
      <IconButton
        ref={buttonRef}
        onClick={toggleMenu}
        disabled={!isLoaded}
        className="u-p-0 u-ml-half"
      >
        <AvatarMyself size={isMobile ? 's' : 'm'} />
      </IconButton>
      {isMobile ? (
        <ConfirmDialog
          open={isOpen}
          onClose={toggleMenu}
          content={
            <UserMenuContent
              showEmailDomainChip={showEmailDomainChip}
              onLogOut={onLogOut}
              instance={instance}
              diskUsage={diskUsage}
              isSettingsAppInstalled={isSettingsAppInstalled}
              closeMenu={toggleMenu}
            />
          }
          componentsProps={{
            dialogContent: {
              classes: styles
            }
          }}
          classes={{
            paper: 'u-bdrs-7'
          }}
        />
      ) : (
        <Menu
          open={isOpen}
          // eslint-disable-next-line react-hooks/refs
          anchorEl={buttonRef.current}
          // eslint-disable-next-line react-hooks/refs
          container={containerRef.current}
          getContentAnchorEl={null}
          onClose={toggleMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
          transformOrigin={{
            vertical: -10,
            horizontal: 0
          }}
          classes={{
            paper: 'u-bdrs-7'
          }}
        >
          <UserMenuContent
            showEmailDomainChip={showEmailDomainChip}
            onLogOut={onLogOut}
            instance={instance}
            diskUsage={diskUsage}
            isSettingsAppInstalled={isSettingsAppInstalled}
            closeMenu={toggleMenu}
          />
        </Menu>
      )}
    </nav>
  )
}

export default UserMenu
