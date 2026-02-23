import React from 'react'

import { getEmojiByCountry } from 'cozy-client/dist/models/country/countries'
import Typography from 'cozy-ui/transpiled/react/Typography'

const FlagImage = ({ iso2, ...props }) => {
  const flagEmoji = getEmojiByCountry(iso2)

  return (
    <Typography {...props} variant="h3">
      {flagEmoji}
    </Typography>
  )
}

export default FlagImage
