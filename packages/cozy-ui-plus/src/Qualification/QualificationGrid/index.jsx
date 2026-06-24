import {
  Bank,
  Bill,
  Car,
  Chess,
  Dots,
  Heart,
  Home,
  People,
  Team,
  Work
} from '@linagora/twake-icons'
import PropTypes from 'prop-types'
import React, { Fragment, useState } from 'react'

import Grid from 'cozy-ui/transpiled/react/Grid'
import { useI18n } from 'twake-i18n'

import { getThemesList } from './helpers'
import QualificationItem from '../QualificationItem'
import withLocales from './locales/withLocales'

const IconByName = {
  people: People,
  team: Team,
  work: Work,
  heart: Heart,
  home: Home,
  car: Car,
  chess: Chess,
  bank: Bank,
  bill: Bill,
  dots: Dots
}

const QualificationGrid = ({ noUndefined, noOthers, noHealth, onClick }) => {
  const themesList = getThemesList(noHealth)
  const { t } = useI18n()
  const [selectedQualification, setSelectedQualification] = useState()

  const handleClick = theme => {
    onClick(theme?.label)
    setSelectedQualification(theme?.label)
  }

  return (
    <Grid container spacing={1}>
      {!noUndefined && (
        <Grid item xs={3} sm={2}>
          <QualificationItem
            label={t('themes.undefined')}
            isSelected={selectedQualification === undefined}
            onClick={() => handleClick()}
          />
        </Grid>
      )}
      {themesList.map((theme, index) => (
        <Fragment key={index}>
          {(!noOthers || theme.label !== 'others') && (
            <Grid item xs={3} sm={2}>
              <QualificationItem
                label={t(`themes.${theme.label}`)}
                icon={IconByName[theme.icon]}
                isSelected={theme.label === selectedQualification}
                onClick={() => handleClick(theme)}
              />
            </Grid>
          )}
        </Fragment>
      ))}
    </Grid>
  )
}

QualificationGrid.defaultProps = {
  noUndefined: false,
  noOthers: false,
  noHealth: false,
  onClick: () => {}
}

QualificationGrid.propTypes = {
  /** Remove `undefined` theme */
  noUndefined: PropTypes.bool,
  /** Remove `others` theme */
  noOthers: PropTypes.bool,
  /** Remove `health` theme */
  noHealth: PropTypes.bool,
  /** Triggered when an item is clicked */
  onClick: PropTypes.func
}

export default withLocales(QualificationGrid)
