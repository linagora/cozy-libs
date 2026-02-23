import React, { useState } from 'react'
import 'react-international-phone/style.css'

import BottomSheet, {
  BottomSheetItem
} from 'cozy-ui/transpiled/react/BottomSheet'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

import ButtonBase from './ButtonBase'
import FlagImage from './FlagImage'

import { defaultCountries, parseCountry } from 'react-international-phone'

const FlagBottomSheet = ({ value, setCountry }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ButtonBase onClick={() => setOpen(true)}>
        <FlagImage iso2={value} />
      </ButtonBase>

      {open && (
        <BottomSheet backdrop onClose={() => setOpen(false)}>
          <BottomSheetItem disableGutters>
            <List>
              {defaultCountries.map(c => {
                const { iso2, name, dialCode } = parseCountry(c)
                return (
                  <ListItem
                    key={iso2}
                    value={iso2}
                    button
                    onClick={() => {
                      setCountry(iso2)
                      setOpen(false)
                    }}
                  >
                    <ListItemIcon>
                      <FlagImage iso2={iso2} />
                    </ListItemIcon>
                    <ListItemText primary={name} />
                    <Typography align="right">+{dialCode}</Typography>
                  </ListItem>
                )
              })}
            </List>
          </BottomSheetItem>
        </BottomSheet>
      )}
    </>
  )
}

export default FlagBottomSheet
