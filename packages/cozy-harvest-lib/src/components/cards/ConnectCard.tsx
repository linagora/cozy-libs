import React from 'react'

import Box from 'cozy-ui/transpiled/react/Box'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Empty from 'cozy-ui/transpiled/react/Empty'
import CloudSync2 from 'cozy-ui/transpiled/react/Icons/CloudSync2'

interface ConnectCardProps {
  description: string
  title: string
  buttonProps: {
    busy: boolean
    disabled: boolean
    label: string
    onClick: () => void
  }
}

export const ConnectCard = ({
  buttonProps,
  description,
  title
}: ConnectCardProps): JSX.Element => (
  <Box
    display="block"
    border={1}
    borderColor="var(--dividerColor)"
    borderRadius={8}
    padding={2}
    className="u-flex u-flex-wrap"
  >
    <Empty icon={CloudSync2} title={title} text={description} />

    <Button className="u-mh-auto" {...buttonProps} />
  </Box>
)
