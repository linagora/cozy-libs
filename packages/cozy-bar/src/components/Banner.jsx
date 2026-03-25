import React, { useCallback, useEffect, useState } from 'react'
import { ButtonLink } from 'cozy-ui/transpiled/react/deprecated/Button'
import useI18n from 'components/useI18n'

const Banner = ({ code, links }) => {
  const { t } = useI18n()
  const [unmounted, setUmounted] = useState(true)

  const animate = useCallback(() => {
    // To animate we have to use a setTimeout to
    // force a CSS class update and trigger CSS animation
    return setTimeout(() => {
      setUmounted(false)
    }, 100)
  }, [setUmounted])

  useEffect(() => {
    animate()
  }, [animate])

  return (
    <div className={`coz-bar-banner${unmounted ? ' unmounted' : ''}`}>
      <p>{t(`banner.${code}.description`)}</p>
      {links && (
        <ButtonLink
          className="coz-bar-banner-button"
          size="tiny"
          href={links}
          label={t(`banner.${code}.CTA`)}
        />
      )}
    </div>
  )
}

export default Banner
