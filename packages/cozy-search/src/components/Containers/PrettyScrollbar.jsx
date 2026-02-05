import cx from 'classnames'
import React from 'react'

import styles from './styles.styl'

const PrettyScrollbar = ({ children, className }) => {
  return (
    <div className={cx(className, styles['pretty-scrollbar'])}>{children}</div>
  )
}

export default PrettyScrollbar
