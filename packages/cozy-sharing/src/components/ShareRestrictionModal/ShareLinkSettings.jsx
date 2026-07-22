import { addDays, isValid } from 'date-fns'
import PropTypes from 'prop-types'
import React from 'react'

import { useI18n } from 'twake-i18n'

import { BoxDate } from './BoxDate'
import { BoxPassword } from './BoxPassword'

export const PASSWORD_MIN_LENGTH = 4

export const ShareLinkSettings = ({
  dateEnabled,
  hasPassword = false,
  isPasswordValid,
  password,
  passwordEnabled,
  selectedDate,
  setDateEnabled,
  setIsDateValid,
  setIsPasswordValid,
  setPassword,
  setPasswordEnabled,
  setSelectedDate
}) => {
  const { t } = useI18n()

  const handlePasswordChange = value => {
    setPassword(value)
    setIsPasswordValid(
      (hasPassword && value.trim().length === 0) ||
        value.trim().length >= PASSWORD_MIN_LENGTH
    )
  }

  const handlePasswordToggle = enabled => {
    setPasswordEnabled(enabled)
    setPassword('')
    setIsPasswordValid(!enabled || hasPassword)
  }

  const handleDateChange = date => {
    setSelectedDate(date)
    setIsDateValid(isValid(date))
  }

  const handleDateToggle = enabled => {
    setDateEnabled(enabled)
    setSelectedDate(enabled ? addDays(new Date(), 30) : null)
    setIsDateValid(true)
  }

  return (
    <>
      <BoxDate
        onChange={handleDateChange}
        date={selectedDate}
        onToggle={handleDateToggle}
        toggle={dateEnabled}
      />
      <BoxPassword
        hasPassword={hasPassword}
        helperText={
          isPasswordValid
            ? null
            : t('ShareRestrictionModal.invalidPasswordMessage', {
                smart_count: PASSWORD_MIN_LENGTH - password.length
              })
        }
        onChange={handlePasswordChange}
        password={password}
        onToggle={handlePasswordToggle}
        toggle={passwordEnabled}
        inputProps={{ minLength: PASSWORD_MIN_LENGTH }}
      />
    </>
  )
}

ShareLinkSettings.propTypes = {
  dateEnabled: PropTypes.bool.isRequired,
  hasPassword: PropTypes.bool,
  isPasswordValid: PropTypes.bool.isRequired,
  password: PropTypes.string,
  passwordEnabled: PropTypes.bool.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  setDateEnabled: PropTypes.func.isRequired,
  setIsDateValid: PropTypes.func.isRequired,
  setIsPasswordValid: PropTypes.func.isRequired,
  setPassword: PropTypes.func.isRequired,
  setPasswordEnabled: PropTypes.func.isRequired,
  setSelectedDate: PropTypes.func.isRequired
}
