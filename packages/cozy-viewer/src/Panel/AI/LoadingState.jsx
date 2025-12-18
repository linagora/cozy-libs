import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import AssistantIcon from 'cozy-ui/transpiled/react/Icons/Assistant'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'

const LoadingState = ({ onStop, t }) => {
  return (
    <>
      <div className={styles.loaderContainer}>
        <div className={styles.loaderBar} />
      </div>
      <div className="u-flex u-flex-items-center u-flex-justify-between u-ph-1">
        <Typography variant="body1" className="u-flex u-flex-items-center">
          <Icon
            icon={AssistantIcon}
            color="var(--primaryColor)"
            className="u-mr-1"
          />
          {t('Viewer.ai.loadingText')}
        </Typography>
        <Button
          size="small"
          variant="text"
          color="default"
          label={t('Viewer.ai.stop')}
          onClick={onStop}
        />
      </div>
    </>
  )
}

LoadingState.propTypes = {
  onStop: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export default LoadingState
