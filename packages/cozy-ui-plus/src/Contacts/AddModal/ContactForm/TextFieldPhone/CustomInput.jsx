import React from 'react'

import Input from 'cozy-ui/transpiled/react/Input'

import ButtonBase from './ButtonBase'

const CustomInput = props => {
  return (
    <ButtonBase>
      <Input {...props} disableUnderline />
    </ButtonBase>
  )
}

export default CustomInput
