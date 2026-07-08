import cx from 'classnames'
import React from 'react'

import flag from 'cozy-flags'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import TwakeKnowledgeChip from './TwakeKnowledgeChip'
import WebSearchChip from './WebSearchChip'
import TChat from '../../assets/tchat.png'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import KnowledgeBaseChip from '../KnowledgeBase/KnowledgeBaseChip'
import { useSelectedAssistantKnowledgeBase } from '../KnowledgeBase/useSelectedAssistantKnowledgeBase'

const TwakeKnowledgeSelector = ({
  className,
  websearchEnabled,
  onToggleWebsearch
}) => {
  const { t } = useI18n()
  const { folderId, folder, isUnavailable, setKnowledgeBaseFolder } =
    useSelectedAssistantKnowledgeBase()

  const websearchEnabledFlag = flag('cozy.assistant.websearch.enabled')
  const sourceKnowledgeEnabledFlag = flag(
    'cozy.assistant.source-knowledge.enabled'
  )
  const hasKnowledgeBase = !!folderId

  // Source toggles. Drive appears here only when no knowledge base is set;
  // when a KB folder is configured it is rendered as KnowledgeBaseChip below
  // (with its own menu) instead.
  const twakeKnowledges = [
    {
      id: 'drive',
      label: t('assistant.twake_knowledges.drive'),
      display: !hasKnowledgeBase,
      icon: TDrive
    },
    {
      id: 'chat',
      label: t('assistant.twake_knowledges.chat'),
      display: flag('cozy.assistant.source-knowledge.chat.enabled'),
      icon: TChat
    },
    {
      id: 'mail',
      label: t('assistant.twake_knowledges.mail'),
      display: true,
      icon: TMail
    }
  ].filter(twakeKnowledge => twakeKnowledge.display)

  if (
    !websearchEnabledFlag &&
    !sourceKnowledgeEnabledFlag &&
    !hasKnowledgeBase
  ) {
    return null
  }

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
      {hasKnowledgeBase && (
        <KnowledgeBaseChip
          folderId={folderId}
          folder={folder}
          isUnavailable={isUnavailable}
          isLast={!sourceKnowledgeEnabledFlag || twakeKnowledges.length === 0}
          onChangeFolder={setKnowledgeBaseFolder}
        />
      )}
      {sourceKnowledgeEnabledFlag &&
        twakeKnowledges.map((twakeKnowledge, index) => (
          <TwakeKnowledgeChip
            key={twakeKnowledge.id}
            twakeKnowledge={twakeKnowledge}
            isLast={index === twakeKnowledges.length - 1}
          />
        ))}
    </div>
  )
}

export default TwakeKnowledgeSelector
