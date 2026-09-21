import cx from 'classnames'
import React from 'react'

import { Drive, Globe, Icon, Mail } from '@linagora/twake-icons'
import flag from 'cozy-flags'
import Chip from 'cozy-ui/transpiled/react/Chips'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import SourceButton, { CHIP_CLASSES } from './SourceButton'
import styles from './styles.styl'
import KnowledgeBaseChip from '../KnowledgeBase/KnowledgeBaseChip'
import { useSelectedAssistantKnowledgeBase } from '../KnowledgeBase/useSelectedAssistantKnowledgeBase'

/**
 * The knowledge sources of the composer. The Drive source is always on:
 * on desktop it is a chip named after the knowledge base folder (the
 * whole Drive without one), whose menu opens the folder or changes it;
 * on mobile it is an icon button. Web search (a toggle) and emails are
 * icon buttons behind their flags: emails show on the default assistant
 * always, on a custom assistant once enabled in the wizard. Sources are
 * enabled/disabled from the wizard, never from the composer.
 */
const TwakeKnowledgeSelector = ({
  className,
  websearchEnabled,
  onToggleWebsearch
}) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const {
    dirId,
    folder,
    isRoot,
    isUnavailable,
    setKnowledgeBaseFolder,
    isRealAssistant,
    hasEmail
  } = useSelectedAssistantKnowledgeBase()

  const websearchEnabledFlag = flag('cozy.assistant.websearch.enabled')
  const mailSourceEnabledFlag = flag(
    'cozy.assistant.source-knowledge.mail.enabled'
  )
  const showMail = mailSourceEnabledFlag && (!isRealAssistant || hasEmail)

  // Pointer activation leaves the focus on the button, whose focus style
  // would then differ from the sibling sources until something else takes
  // it. Drop it for pointer activation only (`detail > 0`), so keyboard
  // users keep their focus ring.
  const handleToggleWebsearch = event => {
    if (event.detail > 0) {
      event.currentTarget.blur()
    }
    onToggleWebsearch(event)
  }

  const driveSource = dirId ? (
    <KnowledgeBaseChip
      variant={isMobile ? 'icon' : 'chip'}
      dirId={dirId}
      folder={folder}
      isRoot={isRoot}
      isUnavailable={isUnavailable}
      onChangeFolder={setKnowledgeBaseFolder}
    />
  ) : isMobile ? (
    <SourceButton
      icon={Drive}
      preserveColor
      label={t('assistant.twake_knowledges.drive')}
    />
  ) : (
    <Chip
      icon={<Icon icon={Drive} size={16} preserveColor />}
      label={t('assistant.twake_knowledges.drive')}
      className={styles['source-chip']}
      classes={CHIP_CLASSES}
    />
  )

  return (
    <div
      role="group"
      aria-label={t('assistant.twake_knowledges.search_in')}
      className={cx('u-flex u-flex-items-center', className)}
    >
      {driveSource}
      {websearchEnabledFlag && (
        <SourceButton
          icon={Globe}
          label={t('assistant.websearch.label')}
          isActive={websearchEnabled}
          aria-pressed={websearchEnabled}
          onClick={handleToggleWebsearch}
          className="u-ml-half"
        />
      )}
      {showMail && (
        <SourceButton
          icon={Mail}
          preserveColor
          label={t('assistant.twake_knowledges.mail')}
          className="u-ml-half"
        />
      )}
    </div>
  )
}

export default TwakeKnowledgeSelector
