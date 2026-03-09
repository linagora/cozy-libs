import React from 'react'
import { defaultCountries, usePhoneInput } from 'react-international-phone'

import InputAdornment from 'cozy-ui/transpiled/react/InputAdornment'
import TextField from 'cozy-ui/transpiled/react/TextField'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import FlagBottomSheet from './FlagBottomSheet'
import FlagImage from './FlagImage'
import FlagMenu from './FlagMenu'

const TextFieldPhone = ({
  name,
  value,
  disabled,
  isDisabled,
  contact,
  onChange,
  ...props
}) => {
  const { isMobile } = useBreakpoints()

  const { inputValue, handlePhoneValueChange, inputRef, country, setCountry } =
    usePhoneInput({
      defaultCountry: 'fr',
      value,
      countries: defaultCountries,
      onChange: data => {
        onChange(data.phone)
      }
    })

  const ResponsiveFlagMenu = isMobile ? FlagBottomSheet : FlagMenu
  const _disabled = disabled || isDisabled?.(name, contact)

  return (
    <TextField
      name={name}
      value={inputValue}
      inputRef={inputRef}
      disabled={_disabled}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {_disabled ? (
              <FlagImage className="u-ml-half" iso2={country.iso2} />
            ) : (
              <ResponsiveFlagMenu
                value={country.iso2}
                setCountry={setCountry}
              />
            )}
          </InputAdornment>
        )
      }}
      onChange={handlePhoneValueChange}
      {...props}
    />
  )
}

export default TextFieldPhone
