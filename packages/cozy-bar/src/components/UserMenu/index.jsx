import React, { useRef, useState } from 'react'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Menu from 'cozy-ui/transpiled/react/Menu'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import { useInstanceInfo } from 'cozy-client'

import UserMenuContent from 'components/UserMenu/UserMenuContent'
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

const UserMenu = ({ onLogOut, isSettingsAppInstalled }) => {
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
          anchorEl={buttonRef.current}
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
