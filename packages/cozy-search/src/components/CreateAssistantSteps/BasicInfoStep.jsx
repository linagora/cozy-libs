import React, { useRef } from 'react'
import { useI18n } from 'twake-i18n'

import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'

const BasicInfoStep = ({
  name,
  instructions,
  avatar,
  onChange,
  onAvatarChange
}) => {
  const { t } = useI18n()
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current.click()
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
          <div
            className={`u-w-3 u-h-3 u-flex u-flex-justify-center u-flex-items-center u-c-pointer u-bd-1 u-bd-coolGrey u-ov-hidden ${styles['avatar-container']}`}
            onClick={handleAvatarClick}
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className={`u-w-100 u-h-100 u-obj-cover ${styles['avatar-image']}`}
              />
            ) : (
              <Icon icon={PlusIcon} />
            )}
          </div>
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
          {t('assistant_create.steps.basic_info.instructions')}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder={t(
            'assistant_create.steps.basic_info.instructions_placeholder'
          )}
          value={instructions}
          onChange={onChange('instructions')}
          variant="outlined"
        />
      </div>
    </div>
  )
}

export default BasicInfoStep
