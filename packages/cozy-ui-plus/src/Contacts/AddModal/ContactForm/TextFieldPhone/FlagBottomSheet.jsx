import React, { useState } from 'react'
import 'react-international-phone/style.css'

import BottomSheet, {
  BottomSheetItem
} from 'cozy-ui/transpiled/react/BottomSheet'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import MenuItem from 'cozy-ui/transpiled/react/MenuItem'
import Typography from 'cozy-ui/transpiled/react/Typography'

import ButtonBase from './ButtonBase'

import {
  defaultCountries,
  FlagImage,
  parseCountry
} from 'react-international-phone'

const FlagBottomSheet = ({ value, setCountry }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ButtonBase onClick={() => setOpen(true)}>
        <FlagImage iso2={value} />
      </ButtonBase>

      {open && (
        <BottomSheet backdrop onClose={() => setOpen(false)}>
          <BottomSheetItem>
            {defaultCountries.map(c => {
              const { iso2, name, dialCode } = parseCountry(c)
              return (
                <MenuItem
                  key={iso2}
                  value={iso2}
                  onClick={() => {
                    setCountry(iso2)
                    setOpen(false)
                  }}
                >
                  <ListItemIcon>
                    <FlagImage iso2={iso2} />
                  </ListItemIcon>
                  <ListItemText primary={name} />
                  <Typography className="u-mr-half" align="right">
                    +{dialCode}
                  </Typography>
                </MenuItem>
              )
            })}
          </BottomSheetItem>
        </BottomSheet>
      )}
    </>
  )
}

export default FlagBottomSheet
