import AppsMenuContent from 'components/AppsMenu/AppsMenuContent'
import React, { useRef, useState } from 'react'

import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import MosaicIcon from 'cozy-ui/transpiled/react/Icons/Mosaic'
import Menu from 'cozy-ui/transpiled/react/Menu'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'

const useStyles = makeStyles({
  root: {
    '& .dialogContentInner': {
      '& .dialogContentWrapper': {
        paddingBottom: '0 !important'
      }
    }
  }
})

const AppsMenu = ({ shortcuts, apps, homeApp, isFetchingApps }) => {
  const [isOpen, setOpen] = useState(false)
  const containerRef = useRef()
  const buttonRef = useRef()

  const { isMobile } = useBreakpoints()

  const toggleMenu = () => {
    setOpen(!isOpen)
  }

  const styles = useStyles()

  return (
    <nav ref={containerRef}>
      <IconButton ref={buttonRef} onClick={toggleMenu} className="u-p-half">
        <Icon icon={MosaicIcon} size="18" />
      </IconButton>
      {isMobile ? (
        <ConfirmDialog
          open={isOpen}
          onClose={toggleMenu}
          content={
            <AppsMenuContent
              apps={apps}
              homeApp={homeApp}
              isFetchingApps={isFetchingApps}
              shortcuts={shortcuts}
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
          <AppsMenuContent
            apps={apps}
            homeApp={homeApp}
            isFetchingApps={isFetchingApps}
            shortcuts={shortcuts}
            closeMenu={toggleMenu}
          />
        </Menu>
      )}
    </nav>
  )
}

export default AppsMenu
