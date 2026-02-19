import React from 'react'
import { defaultCountries, usePhoneInput } from 'react-international-phone'

import InputAdornment from 'cozy-ui/transpiled/react/InputAdornment'
import TextField from 'cozy-ui/transpiled/react/TextField'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import FlagBottomSheet from './FlagBottomSheet'
import FlagMenu from './FlagMenu'

const TextFieldPhone = ({ value, onChange, ...props }) => {
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

  return (
    <TextField
      value={inputValue}
      inputRef={inputRef}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <ResponsiveFlagMenu value={country.iso2} setCountry={setCountry} />
          </InputAdornment>
        )
      }}
      onChange={handlePhoneValueChange}
      {...props}
    />
  )
}

export default TextFieldPhone
