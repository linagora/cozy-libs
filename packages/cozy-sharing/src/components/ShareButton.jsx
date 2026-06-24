import { Icon, Share } from '@linagora/twake-icons'
import classNames from 'classnames'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'

import styles from '../styles/button.styl'

export const ShareButton = ({ label, onClick, className, ...props }) => (
  <Button
    data-test-id="share-button"
    variant="secondary"
    className={className}
    onClick={() => onClick()}
    startIcon={<Icon icon={Share} />}
    label={label}
    {...props}
  />
)

export const SharedByMeButton = ({ label, onClick, className, ...props }) => (
  <Button
    data-test-id="share-by-me-button"
    className={className}
    onClick={() => onClick()}
    icon={<Icon icon={Share} />}
    label={label}
    {...props}
  />
)

export const SharedWithMeButton = ({ label, onClick, className, ...props }) => (
  <Button
    className={classNames(styles['coz-btn-sharedWithMe'], className)}
    onClick={() => onClick()}
    startIcon={<Icon icon={Share} />}
    label={label}
    {...props}
  />
)

export default ShareButton
