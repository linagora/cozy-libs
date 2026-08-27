/* eslint-disable no-console */

import get from 'lodash/get'
import PropTypes from 'prop-types'
import React from 'react'

import { withClient } from 'cozy-client'
import { Intents } from 'cozy-interapp'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import styles from './styles.styl'
import CozyTheme from '../../providers/CozyTheme'

const DEFAULT_DATA = {
  // TODO remove `closeable` since it is only there for backward compatibility
  // https://mattermost.cozycloud.cc/test-team/pl/t1iagfhqp3n8mqf3nchp6bxsur
  closeable: false,
  exposeIntentFrameRemoval: true
}

class IntentIframe extends React.Component {
  state = { error: null, frameLoaded: false, readyToUse: false }

  componentDidMount() {
    const { action, data, type, onCancel, onError, onTerminate, client } =
      this.props

    console.warn(
      'Be carful to use `withBreakpoints()` and not `useBreakpoints()` in intents. See https://github.com/cozy/cozy-ui/issues/1807'
    )

    let create
    if (this.props.create) {
      create = this.props.create
    } else {
      const intents = new Intents({ client })
      create = intents.create
    }

    create(action, type, {
      ...DEFAULT_DATA,
      ...data
    })
      .start(this.intentViewer, {
        onReady: this.onFrameLoaded,
        onHideCross: this.props.onHideCross,
        onShowCross: this.props.onShowCross,
        onReadyToUse: this.onReadyToUse
      })
      .then(result => {
        // eslint-disable-next-line promise/always-return
        result ? onTerminate && onTerminate(result) : onCancel()
      })
      .catch(error => {
        onError?.(error)
        this.setState({ error })
        this.setIsLoading(false)
      })
  }

  onFrameLoaded = () => {
    this.setState({ frameLoaded: true }, () => {
      if (!this.props.waitForReadyToUse || this.state.readyToUse) {
        this.setIsLoading(false)
      }
    })
  }

  onReadyToUse = () => {
    this.setState({ readyToUse: true }, () => {
      if (this.props.waitForReadyToUse && this.state.frameLoaded) {
        this.setIsLoading(false)
      }
    })
    this.props.onReadyToUse?.()
  }

  setIsLoading = isLoading => {
    this.props.iframeProps?.setIsLoading?.(isLoading)
  }

  render() {
    const { data, iframeProps, waitForReadyToUse } = this.props
    const { error, frameLoaded, readyToUse } = this.state
    const loading =
      error === null && (!frameLoaded || (waitForReadyToUse && !readyToUse))
    const themeType = data?.theme?.type
    const forcedTheme = ['light', 'dark'].includes(themeType)
      ? themeType
      : undefined

    return (
      <CozyTheme
        type={forcedTheme}
        ignoreItself={false}
        className={styles.intentContainer}
      >
        <div
          ref={intentViewer => (this.intentViewer = intentViewer)}
          className={styles.intentContainer}
          aria-busy={loading}
          data-iframe-loaded={frameLoaded}
          data-waiting-for-ready-to-use={waitForReadyToUse && !readyToUse}
          {...get(iframeProps, 'wrapperProps')}
        >
          {loading && (
            <div className={styles.intentContainer__loader}>
              <Spinner size="xxlarge" {...get(iframeProps, 'spinnerProps')} />
            </div>
          )}
          {error && (
            <div className={styles.intentContainer__error}>{error.message}</div>
          )}
          {/* intent iframe will be appended here */}
        </div>
      </CozyTheme>
    )
  }
}

export const iframeProps = PropTypes.shape({
  wrapperProps: PropTypes.object,
  spinnerProps: PropTypes.object,
  setIsLoading: PropTypes.func
})

IntentIframe.propTypes = {
  action: PropTypes.string.isRequired,
  create: PropTypes.func,
  type: PropTypes.string.isRequired,
  data: PropTypes.object,
  onCancel: PropTypes.func,
  onError: PropTypes.func,
  onTerminate: PropTypes.func.isRequired,
  iframeProps: iframeProps,
  onHideCross: PropTypes.func,
  onShowCross: PropTypes.func,
  onReadyToUse: PropTypes.func,
  waitForReadyToUse: PropTypes.bool
}

IntentIframe.defaultProps = {
  data: {},
  waitForReadyToUse: false
}

export default withClient(IntentIframe)
