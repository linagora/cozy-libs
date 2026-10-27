import { render } from '@testing-library/react'
import React from 'react'

import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import { SharingBannerCozyToCozy } from './PublicBanner'

jest.mock('twake-i18n')

describe('PublicBanner', () => {
  it('should not add dangerous html', () => {
    // Given
    useI18n.mockReturnValue({
      t: (localeToTranslate, options) => {
        if (localeToTranslate === 'Share.banner.shared_from') {
          return `Shared from ![avatar](${options.image}) <strong>${options.name}</strong>'s cozy.`
        }
        return localeToTranslate
      }
    })
    const publicName = '[Click me!](https://evil.com)'
    const sharing = { attributes: { members: [{ public_name: publicName }] } }

    // When
    const { container } = render(
      <BreakpointsProvider>
        <SharingBannerCozyToCozy
          sharing={sharing}
          avatarURL="http://cozy.localhost:8080/public/avatar?fallback=initials"
          isSharingShortcutCreated={true}
          addSharingLink="discoveryLink"
          onClose={() => {}}
        />
      </BreakpointsProvider>
    )

    // Then
    expect(container.querySelector('.bannermarkdown').innerHTML).toEqual(
      `Shared from <img src="http://cozy.localhost:8080/public/avatar?fallback=initials" alt="avatar"> <strong>&lt;a href="https://evil.com"&gt;Click me!&lt;/a&gt;</strong>'s cozy.`
    )
  })
})
