import React from 'react'

import { DialogCloseButton } from 'cozy-ui/transpiled/react/CozyDialogs'
import { DialogTitle } from 'cozy-ui/transpiled/react/Dialog'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'
import PreviousIcon from 'cozy-ui/transpiled/react/Icons/Previous'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Typography from 'cozy-ui/transpiled/react/Typography'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const FilePickerDialogTitle = ({
  dialogTitleProps,
  dividerProps,
  onClose,
  selectedFiles,
  multiple,
  currentDir,
  goBack,
  search,
  setSearch
}) => {
  const { isMobile } = useBreakpoints()

  return (
    <>
      <DialogTitle
        {...dialogTitleProps}
        className="u-ph-half u-pv-half u-flex u-flex-items-center u-h-3"
      >
        <IconButton onClick={() => goBack()}>
          <Icon icon={PreviousIcon} />
        </IconButton>
        <div className="u-w-100 u-flex u-flex-column u-flex-justify-center u-ml-half">
          <Typography variant="h4">{currentDir?.name ?? 'Open'}</Typography>
          {currentDir?.path && currentDir?.path !== '/' && (
            <Typography variant="subtitle2" color="textSecondary">
              {currentDir?.path}
            </Typography>
          )}
        </div>

        {!isMobile && (
          <SearchBar
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            elevation={0}
            className="u-w-6"
          />
        )}

        <IconButton onClick={() => onClose()}>
          <Icon icon={CrossIcon} />
        </IconButton>
      </DialogTitle>
      <Divider {...dividerProps} />
    </>
  )
}

export default FilePickerDialogTitle
