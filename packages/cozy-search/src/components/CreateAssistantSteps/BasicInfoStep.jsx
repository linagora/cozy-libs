import { Icon, Plus } from '@linagora/twake-icons'
import React, { useRef } from 'react'

import TextField from 'cozy-ui/transpiled/react/TextField'
import Tooltip from 'cozy-ui/transpiled/react/Tooltip'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'
import KnowledgeBaseSection from '../KnowledgeBase/KnowledgeBaseSection'

const BasicInfoStep = ({
  name,
  description,
  icon,
  knowledgeBase,
  onChange,
  onAvatarChange,
  onKnowledgeBaseChange
}) => {
  const { t } = useI18n()
  const { type } = useCozyTheme()
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = event => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onAvatarChange(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className={`u-flex u-flex-column u-gap-1 ${styles.BasicInfoStep}`}>
      <Typography variant="body1" className="u-mb-1 u-c-text-secondary">
        {t('assistant_create.steps.basic_info.description')}
      </Typography>

      <div className="u-mb-1">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.basic_info.avatar')}
        </Typography>
        <div className="u-flex u-flex-items-center u-flex-justify-center">
          <Tooltip
            title={t('assistant_create.steps.basic_info.upload_photo')}
            placement="bottom-start"
            arrow={false}
            classes={{
              tooltip: styles['avatar-tooltip'],
              // Rendered outside the themed tree: the theme class brings
              // the dark colors when needed
              popper: `TwakeTheme--${type}`
            }}
            // Sits at the lower right of the avatar, next to the pointer,
            // as a native tooltip would (the design): shifted from the
            // bottom-left corner by half the 64px avatar plus (9px, 7px),
            // and never flipped away from it
            PopperProps={{
              modifiers: {
                offset: { enabled: true, offset: '41, -25' },
                flip: { enabled: false },
                preventOverflow: { enabled: false }
              }
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-label={t('assistant_create.steps.basic_info.avatar')}
              className={`u-w-3 u-h-3 u-flex u-flex-justify-center u-flex-items-center u-c-pointer u-bd-1 u-bd-coolGrey u-ov-hidden ${styles['avatar-container']}`}
              onClick={handleAvatarClick}
            >
              {icon ? (
                <img
                  src={icon}
                  alt="Avatar"
                  className={`u-w-100 u-h-100 u-obj-cover ${styles['avatar-image']}`}
                />
              ) : (
                <Icon icon={Plus} />
              )}
            </div>
          </Tooltip>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles['file-input']}
            accept="image/*"
            data-testid="avatar-input"
          />
        </div>
      </div>

      <div className="u-mb-1">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.basic_info.name')}
        </Typography>
        <TextField
          fullWidth
          placeholder={t('assistant_create.steps.basic_info.name_placeholder')}
          value={name}
          onChange={onChange('name')}
          variant="outlined"
        />
      </div>

      <div className="u-mb-1">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.basic_info.description_label')}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder={t(
            'assistant_create.steps.basic_info.description_placeholder'
          )}
          value={description}
          onChange={onChange('description')}
          variant="outlined"
        />
      </div>

      <KnowledgeBaseSection
        knowledgeBase={knowledgeBase}
        onChange={onKnowledgeBaseChange}
      />
    </div>
  )
}

export default BasicInfoStep
