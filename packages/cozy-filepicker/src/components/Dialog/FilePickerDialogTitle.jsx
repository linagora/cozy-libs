import { AnimatePresence, motion } from 'motion/react'
import React, { useRef } from 'react'
import { useI18n } from 'twake-i18n'

import Button from 'cozy-ui/transpiled/react/Buttons'
import { DialogTitle } from 'cozy-ui/transpiled/react/Dialog'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'
import PreviousIcon from 'cozy-ui/transpiled/react/Icons/Previous'
import UploadIcon from 'cozy-ui/transpiled/react/Icons/Upload'
import { CircularProgress } from 'cozy-ui/transpiled/react/Progress'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Typography from 'cozy-ui/transpiled/react/Typography'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import { useFilePicker } from '../FilePickerContext'

const initialAnimation = { opacity: 0, y: 10 }
const exitAnimation = {
  opacity: 0,
  y: -10,
  transition: { duration: 0.15, ease: 'easeIn' }
}
const getAnimateAnimation = (delay = 0) => ({
  opacity: 1,
  y: 0,
  transition: { duration: 0.15, delay, ease: 'easeOut' }
})

const FilePickerDialogTitle = () => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const inputRef = useRef(null)
  const {
    dialogTitleProps,
    dividerProps,
    onClose,
    currentDir,
    goBack,
    search,
    setSearch,
    uploadFile,
    uploadingFile,
    multiple
  } = useFilePicker()

  const handleUpload = async e => {
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }
    await uploadFile(files)
  }

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleUpload}
        style={{ display: 'none' }}
        multiple={multiple}
      />
      <DialogTitle
        {...dialogTitleProps}
        className="u-ph-half u-pv-half u-flex u-flex-items-center u-h-3"
      >
        <IconButton onClick={() => goBack()}>
          <Icon icon={PreviousIcon} />
        </IconButton>
        <div className="u-w-100 u-flex u-flex-column u-flex-justify-center u-ml-half">
          <AnimatePresence initial={false}>
            <motion.div
              key={search.length > 0 ? 'search-title' : currentDir?.name}
              initial={initialAnimation}
              animate={getAnimateAnimation(0.1)}
              exit={exitAnimation}
              style={{
                position: 'absolute',
                marginTop:
                  currentDir?.path && currentDir?.path !== '/' ? -18 : 0
              }}
            >
              <Typography variant="h4">
                {search.length > 0
                  ? t('filepicker.title.search')
                  : currentDir?.name ?? t('filepicker.title.open')}
              </Typography>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {search.length == 0 &&
              currentDir?.path &&
              currentDir?.path !== '/' && (
                <motion.div
                  initial={initialAnimation}
                  animate={getAnimateAnimation(0.2)}
                  exit={exitAnimation}
                  style={{
                    position: 'absolute',
                    marginTop: 28
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    {currentDir?.path}
                  </Typography>
                </motion.div>
              )}
          </AnimatePresence>
        </div>

        <Button
          startIcon={
            uploadingFile ? <CircularProgress /> : <Icon icon={UploadIcon} />
          }
          label={t('filepicker.actions.upload')}
          variant="text"
          className="u-mr-half u-ph-1"
          onClick={() => inputRef.current.click()}
        />

        {!isMobile && (
          <SearchBar
            placeholder={t('filepicker.search_placeholder')}
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
