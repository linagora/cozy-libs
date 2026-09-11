import PropTypes from 'prop-types'
import React from 'react'
import ReactTooltip from 'react-tooltip'

import { useI18n } from 'twake-i18n'

import styles from '../styles/tooltip.styl'

export const SharingTooltip = props => (
  <ReactTooltip
    place="bottom"
    effect="solid"
    className={styles['shared-tooltip']}
    {...props}
  >
    {props.children}
  </ReactTooltip>
)
// accepts all the props from https://github.com/wwayne/react-tooltip#options

export const TooltipRecipientList = ({ recipientNames, cutoff }) => {
  const { t } = useI18n()

  return (
    <ul className={styles['shared-tooltip-list']}>
      {recipientNames.slice(0, cutoff).map((name, i) => (
        <li key={`key_name_${name}_${i}`}>{name}</li>
      ))}
      {recipientNames.length > cutoff && (
        <li>
          {t('Share.members.others', {
            smart_count: recipientNames.slice(cutoff).length
          })}
        </li>
      )}
    </ul>
  )
}

TooltipRecipientList.propTypes = {
  recipientNames: PropTypes.arrayOf(PropTypes.string),
  cutoff: PropTypes.number
}
TooltipRecipientList.defaultProps = {
  recipientNames: [],
  cutoff: 4
}
