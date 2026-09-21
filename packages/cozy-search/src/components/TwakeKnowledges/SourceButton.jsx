import cx from 'classnames'
import React, { forwardRef } from 'react'

import { Icon } from '@linagora/twake-icons'
import IconButton from 'cozy-ui/transpiled/react/IconButton'

import styles from './styles.styl'

/**
 * The classes giving a cozy-ui Chip the spacing of the composer chips of the
 * design (with `styles['source-chip']` on the chip itself).
 */
export const CHIP_CLASSES = {
  icon: styles['source-chip-icon'],
  label: styles['source-chip-label']
}

/**
 * A knowledge source of the composer (web search, emails, Drive folder),
 * as the 32px icon button of the design. `icon` is a twake-icons component,
 * monochrome (tinted: primary when active, secondary text color otherwise)
 * or multicolor with `preserveColor` (dimmed when inactive). Without
 * onClick it is a static indicator, not a button.
 */
const SourceButton = forwardRef(
  (
    {
      icon,
      label,
      isActive = true,
      preserveColor = false,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const content = preserveColor ? (
      <Icon
        icon={icon}
        size={20}
        preserveColor
        className={cx({
          [styles['source-button-image--inactive']]: !isActive
        })}
      />
    ) : (
      <Icon
        icon={icon}
        size={20}
        color={isActive ? 'var(--primaryColor)' : 'var(--secondaryTextColor)'}
      />
    )

    if (!onClick) {
      return (
        <span
          ref={ref}
          role="img"
          aria-label={label}
          title={label}
          className={cx(
            'u-flex u-flex-items-center u-flex-justify-center',
            styles['source-button'],
            className
          )}
          {...props}
        >
          {content}
        </span>
      )
    }

    return (
      <IconButton
        ref={ref}
        size="small"
        aria-label={label}
        title={label}
        onClick={onClick}
        className={cx(styles['source-button'], className)}
        {...props}
      >
        {content}
      </IconButton>
    )
  }
)
SourceButton.displayName = 'SourceButton'

export default SourceButton
