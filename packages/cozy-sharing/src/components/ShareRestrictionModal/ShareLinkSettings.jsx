import { addDays, isValid } from 'date-fns'
import PropTypes from 'prop-types'
import React from 'react'

import { Icon, Article } from '@linagora/twake-icons'
import Avatar from 'cozy-ui/transpiled/react/Avatar'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import { useI18n } from 'twake-i18n'

import { BoxDate } from './BoxDate'
import { BoxPassword } from './BoxPassword'

export const PASSWORD_MIN_LENGTH = 4

export const ShareLinkSettings = ({
  activityReportEnabled,
  dateEnabled,
  hasPassword = false,
  isActivityReportShown = false,
  isPasswordValid,
  password,
  passwordEnabled,
  selectedDate,
  setActivityReportEnabled,
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
    if (!enabled && isActivityReportShown) {
      setActivityReportEnabled(false)
    }
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
      {isActivityReportShown && (
        <div className="u-flex u-flex-items-center">
          <Avatar
            size={40}
            color="none"
            className="u-bg-primaryBackgroundLight u-flex-shrink-0 u-mr-half"
            aria-hidden="true"
          >
            <ListItemIcon>
              <Icon icon={Article} size={18} />
            </ListItemIcon>
          </Avatar>
          <Checkbox
            className="u-w-100 u-flex u-flex-justify-between u-ml-0 u-mr-0"
            label={t('ActivityReport.label')}
            labelPlacement="start"
            checked={activityReportEnabled === true}
            disabled={!dateEnabled}
            onChange={event => setActivityReportEnabled(event.target.checked)}
          />
        </div>
      )}
    </>
  )
}

ShareLinkSettings.propTypes = {
  activityReportEnabled: PropTypes.bool,
  setActivityReportEnabled: PropTypes.func,
  dateEnabled: PropTypes.bool.isRequired,
  hasPassword: PropTypes.bool,
  isActivityReportShown: PropTypes.bool,
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
