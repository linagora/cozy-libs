import { render, screen } from '@testing-library/react'
import KonnectorMaintenance from 'components/Maintenance'
import enLocale from 'locales/en.json'
import React from 'react'
import I18n from 'twake-i18n'

describe('KonnectorMaintenance', () => {
  it('should render maintenance component', () => {
    render(
      <I18n lang="en" dictRequire={() => enLocale}>
        <KonnectorMaintenance
          maintenanceMessages={{
            en: {
              long_message: 'A long message',
              short_message: 'A shorter message'
            }
          }}
        />
      </I18n>
    )
    expect(screen.getByText('A long message')).toBeInTheDocument()
    expect(screen.getByText('A shorter message')).toBeInTheDocument()
  })
})
