import PropTypes from 'prop-types'
import React from 'react'

import Box from 'cozy-ui/transpiled/react/Box'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { BoxEditingRights } from './BoxEditingRights'
import { ShareLinkSettings } from './ShareLinkSettings'
import { checkIsPermissionHasPassword } from '../../helpers/permissions'
import { useSharingContext } from '../../hooks/useSharingContext'

export const ShareRestrictionContentModal = ({
  file,
  // Date
  selectedDate,
  setSelectedDate,
  dateToggle,
  setDateToggle,
  setIsValidDate,
  // Password
  isPasswordValid,
  password,
  setPassword,
  passwordToggle,
  setPasswordToggle,
  setIsValidPassword,
  // Editing rights
  editingRights,
  setEditingRights
}) => {
  const { t } = useI18n()
  const { getDocumentPermissions } = useSharingContext()
  const permissions = getDocumentPermissions(file._id)
  const hasPassword = checkIsPermissionHasPassword(permissions)

  return (
    <Box display="flex" flexDirection="column" gridGap="1rem">
      <Typography variant="h4" className="u-mb-half u-ml-half">
        {t('ShareRestrictionModal.title')}
      </Typography>

      <BoxEditingRights
        file={file}
        editingRights={editingRights}
        setEditingRights={setEditingRights}
      />
      <ShareLinkSettings
        dateEnabled={dateToggle}
        hasPassword={hasPassword}
        isPasswordValid={isPasswordValid}
        password={password}
        passwordEnabled={passwordToggle}
        selectedDate={selectedDate}
        setDateEnabled={setDateToggle}
        setIsDateValid={setIsValidDate}
        setIsPasswordValid={setIsValidPassword}
        setPassword={setPassword}
        setPasswordEnabled={setPasswordToggle}
        setSelectedDate={setSelectedDate}
      />
    </Box>
  )
}

ShareRestrictionContentModal.propTypes = {
  file: PropTypes.object.isRequired,
  // Date
  selectedDate: PropTypes.object,
  setSelectedDate: PropTypes.func.isRequired,
  dateToggle: PropTypes.bool,
  setDateToggle: PropTypes.func.isRequired,
  setIsValidDate: PropTypes.func.isRequired,
  // Password
  isPasswordValid: PropTypes.bool.isRequired,
  password: PropTypes.string,
  setPassword: PropTypes.func.isRequired,
  passwordToggle: PropTypes.bool.isRequired,
  setPasswordToggle: PropTypes.func.isRequired,
  setIsValidPassword: PropTypes.func.isRequired,
  // Editing rights
  editingRights: PropTypes.oneOf(['readOnly', 'write']),
  setEditingRights: PropTypes.func.isRequired
}
