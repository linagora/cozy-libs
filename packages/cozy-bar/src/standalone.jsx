const MOUNT_WARN =
  '[cozy-bar] window.twakeConfig.accessToken or cozyURL missing after 30s; bar not mounted'

let mounted = false
let intervalId = null
let attempts = 0

const tryMount = async () => {
  if (mounted) return

  attempts += 1

  const cfg = window.twakeConfig
  if (!cfg || !cfg.accessToken || !cfg.cozyURL) {
    if (attempts >= 30) {
      if (intervalId) clearInterval(intervalId)
      // eslint-disable-next-line no-console
      console.warn(MOUNT_WARN)
    }
    return
  }

  if (!document.body) return

  mounted = true
  if (intervalId) clearInterval(intervalId)

  // eslint-disable-next-line no-console
  console.log('[cozy-bar] mounting...')

  let mountBar
  try {
    const mod = await import(/* webpackMode: 'eager' */ './mountBar')
    mountBar = mod.mountBar
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[cozy-bar] failed to load mountBar:', e)
    return
  }

  try {
    mountBar(cfg)
    // eslint-disable-next-line no-console
    console.log('[cozy-bar] mountBar completed')
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[cozy-bar] mountBar threw:', e)
  }
}

tryMount()
if (!mounted) {
  intervalId = setInterval(tryMount, 1000)
}
