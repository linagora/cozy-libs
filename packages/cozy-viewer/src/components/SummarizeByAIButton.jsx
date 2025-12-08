import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { useI18n } from 'twake-i18n'

import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TextIcon from 'cozy-ui/transpiled/react/Icons/Text'

import styles from './styles.styl'
import { isFileSummaryCompatible } from '../helpers'
import { useViewer } from '../providers/ViewerProvider'

const SummarizeByAIButton = ({ onPaywallRedirect, className }) => {
  const { t } = useI18n()
  const { setIsOpenAiAssistant, file, pdfPageCount } = useViewer()

  const isAiEnabled = flag('ai.enabled')
  const isAiAvailable = flag('ai.available')
  const isSummaryCompatible = isFileSummaryCompatible(file, {
    pageCount: pdfPageCount
  })
  const showSummariseButton = isAiAvailable && isSummaryCompatible

  const handleSummariseClick = () => {
    if (!isAiEnabled && onPaywallRedirect) {
      onPaywallRedirect()
    } else {
      setIsOpenAiAssistant(true)
    }
  }

  return showSummariseButton ? (
    <Button
      variant="text"
      startIcon={
        <Icon
          icon={TextIcon}
          className={cx(styles['viewer-ai-summarise-btn'])}
        />
      }
      aria-label={t('Viewer.summariseWithAi')}
      label={t('Viewer.summariseWithAi')}
      onClick={handleSummariseClick}
      className={cx(styles['viewer-ai-summarise-btn'], className)}
    />
  ) : null
}

SummarizeByAIButton.propTypes = {
  onPaywallRedirect: PropTypes.func
}

export default SummarizeByAIButton
