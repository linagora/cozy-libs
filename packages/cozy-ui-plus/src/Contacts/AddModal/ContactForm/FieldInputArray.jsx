import cx from 'classnames'
import React from 'react'
import { FieldArray } from 'react-final-form-arrays'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import { useI18n, useExtendI18n } from 'twake-i18n'

import FieldInput from './FieldInput'
import { addField, removeField, makeIsRequiredError } from './helpers'
import { locales } from './locales'

const FieldInputArray = ({
  attributes: { name, label, ...restAttributes },
  contacts,
  contact,
  formProps
}) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const { errors } = formProps
  const { disabled, isDisabled } = restAttributes

  return (
    <FieldArray name={name}>
      {({ fields }) => {
        return (
          <>
            {fields.map((nameWithIndex, index) => {
              const field = fields.value[index]
              const key = field?.fieldId || nameWithIndex
              const inputName = `${nameWithIndex}.${name}`
              const _disabled = disabled || isDisabled?.(inputName, contact)
              const showRemove = field?.[name] && !_disabled
              const isError = makeIsRequiredError(
                restAttributes.required,
                formProps
              )

              return (
                <div
                  key={key}
                  className={cx('u-flex u-flex-items-baseline', {
                    'u-mt-1': index !== 0
                  })}
                >
                  <FieldInput
                    attributes={restAttributes}
                    contacts={contacts}
                    contact={contact}
                    error={isError}
                    index={index}
                    showRemove={showRemove}
                    helperText={isError ? errors[inputName] : null}
                    name={inputName}
                    label={t(`Contacts.AddModal.ContactForm.fields.${name}`)}
                    labelProps={label}
                    onRemove={() => removeField(fields, index)}
                  />
                </div>
              )
            })}
            <Button
              variant="text"
              startIcon={<Icon icon={PlusIcon} />}
              onClick={() => addField(fields)}
              label={t(`Contacts.AddModal.ContactForm.addLabel.${name}`)}
            />
          </>
        )
      }}
    </FieldArray>
  )
}

export default FieldInputArray
