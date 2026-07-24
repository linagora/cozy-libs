import cx from 'classnames'
import React from 'react'
import { useParams } from 'react-router-dom'

import flag from 'cozy-flags'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import DriveSourceChip from './DriveSourceChip'
import TwakeKnowledgeChip from './TwakeKnowledgeChip'
import WebSearchChip from './WebSearchChip'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import { useAssistant } from '../AssistantProvider'
import AttachmentsResolver from '../KnowledgeBase/AttachmentsResolver'
import KnowledgeBaseChip from '../KnowledgeBase/KnowledgeBaseChip'
import { useSelectedAssistantKnowledgeBase } from '../KnowledgeBase/useSelectedAssistantKnowledgeBase'

const TwakeKnowledgeSelector = ({
  className,
  websearchEnabled,
  onToggleWebsearch
}) => {
  const { t } = useI18n()
  const {
    dirId,
    folder,
    isUnavailable,
    setKnowledgeBaseFolder,
    isRealAssistant,
    hasEmail
  } = useSelectedAssistantKnowledgeBase()
  const { conversationId } = useParams()
  const { attachmentsSelections } = useAssistant()

  const attachmentsFlag = flag('cozy.assistant.attachments.enabled')
  const canRestrictDrive =
    !!attachmentsFlag && !isRealAssistant && !!conversationId
  const attachmentsSelection = conversationId
    ? attachmentsSelections[conversationId]
    : undefined

  const websearchEnabledFlag = flag('cozy.assistant.websearch.enabled')
  const mailSourceEnabledFlag = flag(
    'cozy.assistant.source-knowledge.mail.enabled'
  )
  const hasKnowledgeBase = !!dirId

  // The Drive source is always on and cannot be disabled: a knowledge-base
  // folder is rendered as KnowledgeBaseChip (with its own menu); for the
  // default assistant, behind `cozy.assistant.attachments.enabled`, it is
  // rendered as the interactive DriveSourceChip, letting the user restrict
  // the search to a folder/files picked for the current conversation;
  // otherwise (flag off, or no folder configured) a static Drive chip stands
  // for the whole Drive. The email source (behind its own flag) is shown on
  // the default assistant always, and on a custom assistant only once the
  // user enabled it in the wizard. The chips are static indicators: sources
  // are enabled/disabled from the wizard, never from the composer.
  const twakeKnowledges = [
    {
      id: 'mail',
      label: t('assistant.twake_knowledges.mail'),
      display: mailSourceEnabledFlag && (!isRealAssistant || hasEmail),
      icon: TMail,
      isSelected: true
    }
  ].filter(twakeKnowledge => twakeKnowledge.display)

  const showSourceChips = twakeKnowledges.length > 0

  return (
    <div
      className={cx(
        'u-flex u-flex-row u-flex-wrap u-flex-items-center u-flex-justify-end',
        className
      )}
    >
      <Typography className="u-mr-half u-fz-tiny u-coolGrey">
        {t('assistant.twake_knowledges.search_in')}
      </Typography>
      {websearchEnabledFlag && (
        <WebSearchChip
          websearchEnabled={websearchEnabled}
          onToggleWebsearch={onToggleWebsearch}
        />
      )}
      {hasKnowledgeBase ? (
        <KnowledgeBaseChip
          dirId={dirId}
          folder={folder}
          isUnavailable={isUnavailable}
          isLast={!showSourceChips}
          onChangeFolder={setKnowledgeBaseFolder}
        />
      ) : canRestrictDrive ? (
        <DriveSourceChip
          conversationId={conversationId}
          isLast={!showSourceChips}
        />
      ) : (
        <TwakeKnowledgeChip
          twakeKnowledge={{
            id: 'drive',
            label: t('assistant.twake_knowledges.drive'),
            icon: TDrive
          }}
          isSelected
          isLast={!showSourceChips}
        />
      )}
      {canRestrictDrive && attachmentsSelection?.length > 0 && (
        <AttachmentsResolver
          conversationId={conversationId}
          selectedDocs={attachmentsSelection}
        />
      )}
      {showSourceChips &&
        twakeKnowledges.map((twakeKnowledge, index) => (
          <TwakeKnowledgeChip
            key={twakeKnowledge.id}
            twakeKnowledge={twakeKnowledge}
            isSelected={twakeKnowledge.isSelected}
            onToggle={twakeKnowledge.onToggle}
            isLast={index === twakeKnowledges.length - 1}
          />
        ))}
    </div>
  )
}

export default TwakeKnowledgeSelector
