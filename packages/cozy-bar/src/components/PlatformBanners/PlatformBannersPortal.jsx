import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { APP_SELECTOR } from '../../dom'

const CONTAINER_ID = 'cozy-platform-banners'
const ACTIVE_CLASS = 'has-platform-banners'

/**
 * Renders into a container created as the first child of the application node,
 * so the application reflows around the banners rather than the bar's chrome.
 *
 * @param {object} props - Props
 * @param {import('react').ReactNode} props.children - What to render
 * @returns {import('react').ReactPortal|null} The portal, once the container exists
 */
export const PlatformBannersPortal = ({ children }) => {
  const [container, setContainer] = useState(null)

  useLayoutEffect(() => {
    const appNode = document.querySelector(APP_SELECTOR)
    if (!appNode) {
      // eslint-disable-next-line no-console
      console.warn(
        `[cozy-bar] no ${APP_SELECTOR} node, platform banners are disabled`
      )
      return
    }

    // Resolved from the DOM, not a ref: React clears its root container on
    // mount, so anything captured earlier points at a detached node.
    let node = appNode.querySelector(`#${CONTAINER_ID}`)
    if (!node) {
      node = document.createElement('div')
      node.id = CONTAINER_ID
      appNode.insertBefore(node, appNode.firstChild)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContainer(node)

    appNode.classList.add(ACTIVE_CLASS)
    return () => appNode.classList.remove(ACTIVE_CLASS)
  }, [])

  if (!container) return null
  return createPortal(children, container)
}
