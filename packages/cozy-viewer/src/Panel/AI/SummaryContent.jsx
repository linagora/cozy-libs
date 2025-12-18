import PropTypes from 'prop-types'
import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CopyIcon from 'cozy-ui/transpiled/react/Icons/Copy'
import RefreshIcon from 'cozy-ui/transpiled/react/Icons/Refresh'
import Stack from 'cozy-ui/transpiled/react/Stack'
import Typography from 'cozy-ui/transpiled/react/Typography'

const SummaryContent = ({ summary, error, onRefresh, onCopy, t }) => {
  return (
    <Stack spacing="s" className="u-ph-1">
      <div>
        <div className="u-flex u-flex-items-center u-flex-justify-between u-mb-1">
          <Typography variant="subtitle1">{t('Viewer.ai.bodyText')}</Typography>
          <div className="u-flex">
            <IconButton size="small" onClick={onRefresh}>
              <Icon icon={RefreshIcon} />
            </IconButton>
            {summary && (
              <IconButton size="small" onClick={onCopy}>
                <Icon icon={CopyIcon} />
              </IconButton>
            )}
          </div>
        </div>
        <Typography className="u-mb-1">
          {error ? (
            <span style={{ color: 'var(--errorColor)' }}>{error}</span>
          ) : (
            summary
          )}
        </Typography>
        {summary && (
          <Typography variant="caption" color="textSecondary">
            {t('Viewer.ai.footerText')}
          </Typography>
        )}
      </div>
    </Stack>
  )
}

SummaryContent.propTypes = {
  summary: PropTypes.string,
  error: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export default SummaryContent
