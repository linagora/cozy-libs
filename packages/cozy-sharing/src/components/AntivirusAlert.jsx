import PropTypes from 'prop-types'
import React from 'react'
import { useI18n } from 'twake-i18n'

import Alert from 'cozy-ui/transpiled/react/Alert'

const AntivirusAlert = ({ document }) => {
  const { t } = useI18n()
  const needsWarning =
    document?.antivirus_scan &&
    ['pending', 'error', 'skipped'].includes(document.antivirus_scan?.status)

  if (!needsWarning) {
    return null
  }

  return (
    <Alert className="u-mb-1" severity="warning">
      {t('Files.share.notScannedWarning')}
    </Alert>
  )
}

AntivirusAlert.propTypes = {
  document: PropTypes.object
}

export default AntivirusAlert
