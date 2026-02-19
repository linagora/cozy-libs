import React from 'react'
import 'react-international-phone/style.css'

import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import MenuItem from 'cozy-ui/transpiled/react/MenuItem'
import Select from 'cozy-ui/transpiled/react/Select'
import Typography from 'cozy-ui/transpiled/react/Typography'

import CustomInput from './CustomInput'

import {
  defaultCountries,
  FlagImage,
  parseCountry
} from 'react-international-phone'

const FlagMenu = ({ value, setCountry }) => {
  return (
    <Select
      input={<CustomInput />}
      MenuProps={{
        style: {
          height: '300px'
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left'
        }
      }}
      value={value}
      renderValue={v => (
        <FlagImage
          iso2={v}
          style={{ verticalAlign: 'bottom', marginLeft: '0.5rem' }}
        />
      )}
      onChange={e => setCountry(e.target.value)}
    >
      {defaultCountries.map(c => {
        const { iso2, name, dialCode } = parseCountry(c)
        return (
          <MenuItem key={iso2} value={iso2}>
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
    </Select>
  )
}

export default FlagMenu
