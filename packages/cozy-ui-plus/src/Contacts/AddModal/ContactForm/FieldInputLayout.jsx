import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n, useExtendI18n } from 'twake-i18n'

import FieldInput from './FieldInput'
import FieldInputAccordion from './FieldInputAccordion'
import FieldInputArray from './FieldInputArray'
import { makeIsRequiredError } from './helpers'
import { locales } from './locales'

const FieldInputLayout = ({
  attributes,
  contacts,
  contact,
  showSecondaryFields,
  formProps
}) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const { errors } = formProps
  const { name, label, layout, icon, isSecondary, ...restAttributes } =
    attributes

  const isError = makeIsRequiredError(restAttributes.required, formProps)

  return (
    <div
      className={cx('u-mt-1', {
        'u-flex-items-center': !layout,
        'u-flex-items-baseline': !!layout,
        'u-flex': !isSecondary || showSecondaryFields,
        'u-dn': isSecondary && !showSecondaryFields
      })}
    >
      {icon && (
        <div className="u-w-2-half">
          <Icon icon={icon} color="var(--iconTextColor)" />
        </div>
      )}
      <div className="u-w-100">
        {layout === 'array' ? (
          <FieldInputArray
            attributes={attributes}
            contacts={contacts}
            contact={contact}
            formProps={formProps}
          />
        ) : layout === 'accordion' ? (
          <FieldInputAccordion
            attributes={attributes}
            contacts={contacts}
            contact={contact}
            error={isError}
            helperText={isError ? errors[name] : null}
          />
        ) : (
          <FieldInput
            attributes={restAttributes}
            contacts={contacts}
            contact={contact}
            error={isError}
            helperText={isError ? errors[name] : null}
            name={name}
            label={t(`Contacts.AddModal.ContactForm.fields.${name}`)}
            labelProps={label}
          />
        )}
      </div>
    </div>
  )
}

FieldInputLayout.propTypes = {
  attributes: PropTypes.object,
  contacts: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.object)
  }),
  contact: PropTypes.object,
  formProps: PropTypes.object
}

export default FieldInputLayout
