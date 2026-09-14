import PropTypes from 'prop-types'
import React from 'react'
import snarkdown from 'snarkdown'

import { Icon, FolderOutlined, ArrowUp } from '@linagora/twake-icons'
import { useClient } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Timeline from 'cozy-ui/transpiled/react/Timeline'
import TimelineConnector from 'cozy-ui/transpiled/react/TimelineConnector'
import TimelineContent from 'cozy-ui/transpiled/react/TimelineContent'
import TimelineDot from 'cozy-ui/transpiled/react/TimelineDot'
import TimelineItem from 'cozy-ui/transpiled/react/TimelineItem'
import TimelineOppositeContent from 'cozy-ui/transpiled/react/TimelineOppositeContent'
import TimelineSeparator from 'cozy-ui/transpiled/react/TimelineSeparator'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { DEFAULT_DISPLAY_NAME } from '../../helpers/recipients'
import { useFetchDocumentPath } from '../../hooks/useFetchDocumentPath'
import { useSharingContext } from '../../hooks/useSharingContext'
import { getDisplayName } from '../../models'

const DowngradePermissionConfirmDialog = ({
  document,
  recipient,
  onCancel,
  onConfirm
}) => {
  const { t } = useI18n()
  const client = useClient()
  const { getSharedParentPath } = useSharingContext()

  const documentPath = useFetchDocumentPath(client, document)
  const sharedParentPath = documentPath && getSharedParentPath(documentPath)
  const parentFolderName = sharedParentPath?.split('/').pop()
  const contactName = getDisplayName(recipient, t(DEFAULT_DISPLAY_NAME))
  const [before, afterOpen] = snarkdown(
    t('DowngradePermissionConfirmDialog.content', { contactName })
  ).split('<strong>')
  const [boldContactName, after] = afterOpen.split('</strong>')

  return (
    <ConfirmDialog
      open
      title={t('DowngradePermissionConfirmDialog.title')}
      content={
        <>
          <Typography>
            {before}
            <strong>{boldContactName}</strong>
            {after}
          </Typography>

          <Timeline>
            <TimelineItem>
              <TimelineOppositeContent style={{ display: 'none' }} />
              <TimelineSeparator>
                <TimelineDot className="u-bg-transparent u-bdw-0 u-elevation-0 u-p-0">
                  <div className="u-w-1-half u-flex u-flex-justify-center">
                    <Icon icon={FolderOutlined} size={24} />
                  </div>
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body2">{parentFolderName}</Typography>
                <div>
                  <s>
                    <Typography display="inline" variant="caption">
                      {t('Share.type.two-way')}
                    </Typography>
                  </s>
                  <Icon
                    className="u-mh-half"
                    color="var(--secondaryTextColor)"
                    icon={ArrowUp}
                    rotate={90}
                    size={12}
                  />
                  <Typography display="inline" variant="caption">
                    {t('Share.type.one-way')}
                  </Typography>
                </div>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineOppositeContent style={{ display: 'none' }} />
              <TimelineSeparator>
                <TimelineDot className="u-bg-transparent u-bdw-0 u-elevation-0 u-p-0">
                  <div className="u-w-1-half u-flex u-flex-justify-center">
                    <Icon icon={FolderOutlined} size={16} />
                  </div>
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body2">{document.name}</Typography>
                <div>
                  <s>
                    <Typography display="inline" variant="caption">
                      {t('Share.type.two-way')}
                    </Typography>
                  </s>
                  <Icon
                    className="u-mh-half"
                    color="var(--secondaryTextColor)"
                    icon={ArrowUp}
                    rotate={90}
                    size={12}
                  />
                  <Typography display="inline" variant="caption">
                    {t('Share.type.one-way')}
                  </Typography>
                </div>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </>
      }
      actions={
        <>
          <Button
            variant="secondary"
            label={t('DowngradePermissionConfirmDialog.cancel')}
            onClick={onCancel}
          />
          <Button
            variant="primary"
            label={t('DowngradePermissionConfirmDialog.confirm')}
            onClick={onConfirm}
          />
        </>
      }
      onClose={onCancel}
    />
  )
}

DowngradePermissionConfirmDialog.propTypes = {
  document: PropTypes.object.isRequired,
  recipient: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
}

export default DowngradePermissionConfirmDialog
