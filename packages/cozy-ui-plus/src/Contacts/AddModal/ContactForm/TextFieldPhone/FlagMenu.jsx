import React from 'react'
import { defaultCountries, parseCountry } from 'react-international-phone'

import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import MenuItem from 'cozy-ui/transpiled/react/MenuItem'
import Select from 'cozy-ui/transpiled/react/Select'
import Typography from 'cozy-ui/transpiled/react/Typography'

import CustomInput from './CustomInput'
import FlagImage from './FlagImage'

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
      renderValue={v => <FlagImage className="u-ml-half" iso2={v} />}
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
