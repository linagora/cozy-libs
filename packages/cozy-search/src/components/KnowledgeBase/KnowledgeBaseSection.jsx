import React, { useState } from 'react'

import { Icon, Cross } from '@linagora/twake-icons'
import { useQuery } from 'cozy-client'
import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import FolderPickerDialog from './FolderPickerDialog'
import {
  getKnowledgeBaseDirId,
  hasEmailKnowledgeBase,
  makeEmailKnowledgeBaseEntry,
  makeKnowledgeBaseEntry,
  withKnowledgeBaseEntry,
  withoutKnowledgeBaseDoctype
} from './knowledgeBase'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import { buildFileByIdQuery, EMAIL_DOCTYPE, FILES_DOCTYPE } from '../queries'

const KnowledgeBaseSection = ({ knowledgeBase = [], onChange }) => {
  const { t } = useI18n()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const dirId = getKnowledgeBaseDirId({ knowledgeBase })
  const hasEmail = hasEmailKnowledgeBase({ knowledgeBase })
  const fileQuery = buildFileByIdQuery(dirId)
  const { data: folder, fetchStatus } = useQuery(
    fileQuery.definition,
    fileQuery.options
  )
  const isUnavailable =
    !!dirId &&
    (fetchStatus === 'failed' ||
      !!folder?.trashed ||
      !!folder?.path?.startsWith('/.cozy_trash'))

  const showMail = flag('cozy.assistant.source-knowledge.mail.enabled')

  const handleSelectFolder = pickedFolder =>
    onChange(
      withKnowledgeBaseEntry(
        knowledgeBase,
        makeKnowledgeBaseEntry(pickedFolder)
      )
    )
  const handleRemoveFolder = () =>
    onChange(withoutKnowledgeBaseDoctype(knowledgeBase, FILES_DOCTYPE))
  const handleAddEmails = () =>
    onChange(
      withKnowledgeBaseEntry(knowledgeBase, makeEmailKnowledgeBaseEntry())
    )
  const handleRemoveEmails = () =>
    onChange(withoutKnowledgeBaseDoctype(knowledgeBase, EMAIL_DOCTYPE))

  return (
    <div className="u-mb-1">
      <Typography variant="h6" className="u-mb-half">
        {t('assistant_create.steps.basic_info.knowledge_base')}
      </Typography>
      <Typography variant="body2" className="u-mb-half u-c-text-secondary">
        {t('assistant_create.steps.basic_info.knowledge_base_placeholder')}
      </Typography>
      <div className="u-flex u-flex-row u-flex-items-center u-flex-wrap">
        {dirId ? (
          <Chip
            icon={<img alt="" aria-hidden="true" src={TDrive} width={16} />}
            label={
              isUnavailable
                ? t('assistant.knowledge_base.unavailable')
                : (folder?.name ?? '…')
            }
            deleteIcon={
              <Icon
                icon={Cross}
                size={10}
                // inline width/height beats MUI v4's fixed deleteIcon class size
                style={{ height: 10, width: 10 }}
                aria-label={t('assistant.knowledge_base.remove')}
              />
            }
            onDelete={handleRemoveFolder}
            className="u-w-auto u-ph-half"
          />
        ) : (
          <Button
            variant="secondary"
            size="small"
            startIcon={
              <img alt="" aria-hidden="true" src={TDrive} width={16} />
            }
            label={t('assistant_create.steps.basic_info.from_drive')}
            onClick={() => setIsPickerOpen(true)}
          />
        )}
        {showMail &&
          (hasEmail ? (
            <Chip
              icon={<img alt="" aria-hidden="true" src={TMail} width={16} />}
              label={t('assistant.knowledge_base.emails')}
              deleteIcon={
                <Icon
                  icon={Cross}
                  size={10}
                  // inline width/height beats MUI v4's fixed deleteIcon class size
                  style={{ height: 10, width: 10 }}
                  aria-label={t('assistant.knowledge_base.remove_emails')}
                />
              }
              onDelete={handleRemoveEmails}
              className="u-w-auto u-ph-half u-ml-half"
            />
          ) : (
            <Button
              variant="secondary"
              size="small"
              className="u-ml-half"
              startIcon={
                <img alt="" aria-hidden="true" src={TMail} width={16} />
              }
              label={t('assistant_create.steps.basic_info.from_mail')}
              onClick={handleAddEmails}
            />
          ))}
      </div>
      {isPickerOpen && (
        <FolderPickerDialog
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleSelectFolder}
        />
      )}
    </div>
  )
}

export default KnowledgeBaseSection
