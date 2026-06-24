import { Icon, Dropdown, Dropup } from '@linagora/twake-icons'
import React, { useState } from 'react'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import { useI18n, useExtendI18n } from 'twake-i18n'

import FieldInput from './FieldInput'
import { locales } from './locales'

const FieldInputAccordion = ({
  attributes: { name, label, subFields, ...restAttributes },
  contacts,
  contact,
  error,
  helperText
}) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const [showExtended, setShowExtended] = useState(false)

  return (
    <>
      <div className="u-flex u-flex-items-baseline">
        <FieldInput
          attributes={restAttributes}
          contacts={contacts}
          contact={contact}
          error={error}
          helperText={helperText}
          name={name}
          label={t(`Contacts.AddModal.ContactForm.fields.${name}`)}
          labelProps={label}
        />
        <IconButton
          className="u-ml-half"
          size="medium"
          onClick={() => setShowExtended(v => !v)}
        >
          <Icon icon={showExtended ? Dropup : Dropdown} />
        </IconButton>
      </div>
      {subFields.map(({ name, ...attributes }, index) => {
        return (
          <FieldInput
            key={index}
            className="u-mt-1"
            attributes={attributes}
            name={name}
            isInvisible={!showExtended}
            label={t(`Contacts.AddModal.ContactForm.fields.${name}`)}
          />
        )
      })}
    </>
  )
}

export default FieldInputAccordion
