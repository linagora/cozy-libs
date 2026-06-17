import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import Sprite from 'cozy-ui/transpiled/react/Icon/Sprite'
import Check from 'cozy-ui/transpiled/react/Icons/Check'
import CrossCircleOutlineIcon from 'cozy-ui/transpiled/react/Icons/CrossCircleOutline'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Button from 'cozy-ui/transpiled/react/Buttons'

const MyComponent = () => (
  <div>
    <Sprite />
    <Icon icon={Check} />
    <Icon icon={CrossCircleOutlineIcon} size={24} />
    <IconButton icon="add" label="Add" />
    <Button label="Hello" />
  </div>
)

export default MyComponent
