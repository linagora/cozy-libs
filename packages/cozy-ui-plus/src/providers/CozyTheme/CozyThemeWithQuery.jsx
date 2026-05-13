import React from 'react'

import { useQuery, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import DumbCozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'

import { buildSettingsInstanceQuery } from './queries'

const CozyThemeWithQuery = props => {
  const instanceQuery = buildSettingsInstanceQuery()
  const { data: instance, ...instanceQueryLeft } = useQuery(
    instanceQuery.definition,
    instanceQuery.options
  )

  if (
    isQueryLoading(instanceQueryLeft) &&
    !hasQueryBeenLoaded(instanceQueryLeft)
  ) {
    return null
  }

  const _type = props.type || instance?.colorScheme

  return <DumbCozyTheme {...props} type={_type} />
}

export default CozyThemeWithQuery
