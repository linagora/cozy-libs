import cx from 'classnames'
import uniqueId from 'lodash/uniqueId'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { Field } from 'react-final-form'

import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n, useExtendI18n } from 'twake-i18n'

import FieldInputWrapper from './FieldInputWrapper'
import HasValueCondition from './HasValueCondition'
import { RelatedContactList } from './RelatedContactList'
import RemoveButton from './RemoveButton'
import { locales } from './locales'
import ContactAddressDialog from '../ContactAddressDialog'
import { fieldInputAttributesTypes, labelPropTypes } from '../types'

const FieldAndRemove = ({ showRemove, onRemove, ...props }) => {
  const { isMobile } = useBreakpoints()

  if (isMobile) {
    return (
      <div className="u-flex u-flex-items-center u-w-100">
        <Field {...props} />
        {showRemove && <RemoveButton onRemove={onRemove} />}
      </div>
    )
  }

  return <Field {...props} />
}

const FieldInput = ({
  name,
  labelProps,
  className,
  attributes: { subFields, ...restAttributes },
  contacts,
  contact,
  error,
  onRemove,
  showRemove,
  helperText,
  label,
  isInvisible
}) => {
  const [id] = useState(uniqueId('field_')) // state only use to generate id once and not at each render
  const [hasBeenFocused, setHasBeenFocused] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [isRelatedContactDialogOpen, setIsRelatedContactDialogOpen] =
    useState(false)
  useExtendI18n(locales)
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  const handleClick = () => {
    if (name.includes('address')) {
      setIsAddressDialogOpen(true)
    }

    if (name.includes('relatedContact')) {
      setIsRelatedContactDialogOpen(true)
    }
  }

  const onFocus = () => {
    setHasBeenFocused(true)
  }

  return (
    <div
      className={cx(className, 'u-flex-column-s u-flex-items-center u-w-100', {
        'u-flex': !isInvisible,
        'u-dn': isInvisible
      })}
    >
      <FieldAndRemove
        error={error}
        helperText={helperText}
        label={label}
        id={id}
        attributes={restAttributes}
        name={name}
        contact={contact}
        component={FieldInputWrapper}
        showRemove={showRemove}
        onRemove={onRemove}
        onFocus={onFocus}
        onClick={handleClick}
      />
      {isAddressDialogOpen && (
        <ContactAddressDialog
          onClose={() => setIsAddressDialogOpen(false)}
          name={name}
          subFields={subFields}
        />
      )}
      {isRelatedContactDialogOpen && (
        <RelatedContactList
          onClose={() => setIsRelatedContactDialogOpen(false)}
          name={name}
          contacts={contacts}
        />
      )}
      {labelProps && (
        <HasValueCondition name={name} otherCondition={hasBeenFocused}>
          <div className="u-mt-half-s u-ml-half u-ml-0-s u-flex-shrink-0 u-w-100-s u-w-auto u-miw-4">
            <Field
              attributes={labelProps}
              name={`${name}Label`}
              label={t('Contacts.AddModal.ContactForm.fields.label')}
              contact={contact}
              component={FieldInputWrapper}
              onFocus={onFocus}
            />
          </div>
        </HasValueCondition>
      )}
      {showRemove && !isMobile && <RemoveButton onRemove={onRemove} />}
    </div>
  )
}

FieldInput.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  labelProps: labelPropTypes,
  attributes: fieldInputAttributesTypes,
  /** Whether the field is visible by the user or not (still in the DOM anyway) */
  isInvisible: PropTypes.bool,
  contacts: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.object)
  }),
  contact: PropTypes.object,
  // Destructuring props
  id: PropTypes.string,
  label: PropTypes.string
}

FieldInput.defaultProps = {
  labelProps: null
}

export default FieldInput
