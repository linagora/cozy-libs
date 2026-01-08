import cx from 'classnames'
import React, { useState, useRef } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import AttachmentIcon from 'cozy-ui/transpiled/react/Icons/Attachment'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'
import TDrive from '../../assets/tdrive.png'

const UploadFileButton = () => {
  const buttonRef = useRef(null)
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <div ref={buttonRef}>
        <IconButton size="small" onClick={handleClick}>
          <Icon icon={PlusIcon} />
        </IconButton>
      </div>
      {open && (
        <ActionsMenu
          open
          ref={buttonRef}
          actions={[]}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
        >
          <ActionsMenuItem className={cx(styles['upload-file-item'])}>
            <Icon
              icon={AttachmentIcon}
              className={cx(styles['upload-file-item-icon'])}
            />
            <Typography variant="body1">Upload files</Typography>
          </ActionsMenuItem>
          <ActionsMenuItem className={cx(styles['upload-file-item'])}>
            <img src={TDrive} className={cx(styles['upload-file-item-icon'])} />
            <Typography variant="body1">Import from Drive</Typography>
            <Chip size="small" label="New" variant="active" />
          </ActionsMenuItem>
        </ActionsMenu>
      )}
    </>
  )
}

export default UploadFileButton
