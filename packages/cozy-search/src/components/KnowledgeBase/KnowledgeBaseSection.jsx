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
  getKnowledgeBaseFolderId,
  makeKnowledgeBaseEntry
} from './knowledgeBase'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import { buildFileByIdQuery } from '../queries'

const KnowledgeBaseSection = ({ knowledgeBase = [], onChange }) => {
  const { t } = useI18n()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const folderId = getKnowledgeBaseFolderId({ knowledgeBase })
  const fileQuery = buildFileByIdQuery(folderId)
  const { data: folder } = useQuery(fileQuery.definition, fileQuery.options)

  const showMailButton = flag('cozy.assistant.source-knowledge.enabled')

  const handleSelect = pickedFolder =>
    onChange([makeKnowledgeBaseEntry(pickedFolder)])
  const handleRemove = () => onChange([])

  return (
    <div className="u-mb-1">
      <Typography variant="h6" className="u-mb-half">
        {t('assistant_create.steps.basic_info.knowledge_base')}
      </Typography>
      <Typography variant="body2" className="u-mb-half u-c-text-secondary">
        {t('assistant_create.steps.basic_info.knowledge_base_placeholder')}
      </Typography>
      {folderId ? (
        <Chip
          icon={<img alt="" aria-hidden="true" src={TDrive} width={16} />}
          label={folder?.name ?? '…'}
          deleteIcon={
            <Icon
              icon={Cross}
              size={16}
              aria-label={t('assistant.knowledge_base.remove')}
            />
          }
          onDelete={handleRemove}
          className="u-w-auto u-ph-half"
        />
      ) : (
        <div className="u-flex u-flex-row u-flex-items-center">
          <Button
            variant="secondary"
            size="small"
            startIcon={
              <img alt="" aria-hidden="true" src={TDrive} width={16} />
            }
            label={t('assistant_create.steps.basic_info.from_drive')}
            onClick={() => setIsPickerOpen(true)}
          />
          {showMailButton && (
            <Button
              variant="secondary"
              size="small"
              className="u-ml-half"
              startIcon={
                <img alt="" aria-hidden="true" src={TMail} width={16} />
              }
              label={t('assistant_create.steps.basic_info.from_mail')}
              disabled
            />
          )}
        </div>
      )}
      {isPickerOpen && (
        <FolderPickerDialog
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

export default KnowledgeBaseSection
