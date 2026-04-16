import useI18n from 'components/useI18n'
import { buildAppsQuery } from 'queries'
import React from 'react'

import { useInstanceInfo } from 'cozy-client'
import { useQuery, hasQueryBeenLoaded } from 'cozy-client'
import Chip from 'cozy-ui/transpiled/react/Chips'

const EmailDomainChip = () => {
  const { t } = useI18n()
  const {
    instance: { data: instanceData },
    isLoaded: isInstanceInfoLoaded
  } = useInstanceInfo()

  const appsQuery = buildAppsQuery()
  const appsResult = useQuery(appsQuery.definition, appsQuery.options)
  const isAppsQueryLoaded = hasQueryBeenLoaded(appsResult)

  if (!isInstanceInfoLoaded || !isAppsQueryLoaded) {
    return null
  }

  const isMailAppInstalled = appsResult.data.some(app =>
    app.slug.includes('mail')
  )
  const isShown = !!instanceData.org_id && !isMailAppInstalled

  if (!isShown) {
    return null
  }

  return (
    <div className="u-flex u-flex-justify-center u-mt-half">
      <Chip
        variant="ghost"
        color="warning"
        label={t('userMenu.emailDomainNotActive')}
      />
    </div>
  )
}

export default EmailDomainChip
