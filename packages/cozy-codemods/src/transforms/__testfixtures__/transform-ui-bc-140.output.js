import React from 'react'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Button from 'cozy-ui/transpiled/react/Buttons'

import { Icon, Sprite, Check, CrossCircleOutline } from "@linagora/twake-icons";

const MyComponent = () => (
  <div>
    <Sprite />
    <Icon icon={Check} />
    <Icon icon={CrossCircleOutline} size={24} />
    <IconButton icon="add" label="Add" />
    <Button label="Hello" />
  </div>
)

export default MyComponent
