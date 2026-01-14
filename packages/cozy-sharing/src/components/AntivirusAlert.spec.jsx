import { render } from '@testing-library/react'
import React from 'react'
import { I18nContext } from 'twake-i18n'

import AntivirusAlert from './AntivirusAlert'

describe('AntivirusAlert', () => {
  const t = jest.fn(key => key)
  const i18nContext = { t }

  const setup = props => {
    return render(
      <I18nContext.Provider value={i18nContext}>
        <AntivirusAlert {...props} />
      </I18nContext.Provider>
    )
  }

  it('should render nothing if no antivirus_scan', () => {
    const { queryByRole } = setup({ document: {} })
    expect(queryByRole('alert')).toBeNull()
  })

  it('should render nothing if antivirus_scan status is "scanned"', () => {
    const { queryByRole } = setup({
      document: { antivirus_scan: { status: 'scanned' } }
    })
    expect(queryByRole('alert')).toBeNull()
  })

  it('should render alert if antivirus_scan status is "pending"', () => {
    const { getByRole } = setup({
      document: { antivirus_scan: { status: 'pending' } }
    })
    expect(getByRole('alert')).toBeTruthy()
    expect(t).toHaveBeenCalledWith('Files.share.notScannedWarning')
  })

  it('should render alert if antivirus_scan status is "error"', () => {
    const { getByRole } = setup({
      document: { antivirus_scan: { status: 'error' } }
    })
    expect(getByRole('alert')).toBeTruthy()
  })

  it('should render alert if antivirus_scan status is "skipped"', () => {
    const { getByRole } = setup({
      document: { antivirus_scan: { status: 'skipped' } }
    })
    expect(getByRole('alert')).toBeTruthy()
  })
})
