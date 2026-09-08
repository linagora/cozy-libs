import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { Sources } from './Sources'

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: (key, count) => `${key}:${count}` })
}))

// jsdom implements no layout, so the scroll-into-view effect needs a stub.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn()
})

const DummyIcon = () => <svg />

const renderExpanded = props => {
  const utils = render(<Sources messageId="m1" {...props} />)
  // Sources are collapsed behind a chip (mountOnEnter), so expand first.
  fireEvent.click(screen.getByText(/^assistant\.sources:/))
  return utils
}

describe('Sources', () => {
  it('links a file source to the url resolved by the adapter', () => {
    renderExpanded({
      files: [
        {
          _id: 'f1',
          name: 'report.pdf',
          path: '/Documents/report.pdf',
          url: 'https://drive.example/folder/d1/file/f1',
          icon: DummyIcon
        }
      ]
    })

    const link = screen.getByText('report.pdf').closest('a')
    expect(link).toHaveProperty(
      'href',
      'https://drive.example/folder/d1/file/f1'
    )
    // The path is shown without the file name, as the folder it lives in.
    expect(screen.getByText('/Documents/')).toBeTruthy()
  })

  it('links an email source to the url resolved by the adapter', () => {
    renderExpanded({
      emails: [
        {
          id: 'e1',
          datetime: '2026-08-20T10:00:00.000Z',
          'email.subject': 'Quarterly report',
          'email.preview': 'Please find attached',
          url: 'https://mail.example/bridge/dashboard/e1'
        }
      ]
    })

    const link = screen.getByText('2026-08-20 - Quarterly report').closest('a')
    expect(link).toHaveProperty(
      'href',
      'https://mail.example/bridge/dashboard/e1'
    )
  })

  it('renders no email item when the adapter resolved no url', () => {
    renderExpanded({
      emails: [{ id: 'e1', 'email.subject': 'No link', 'email.preview': 'x' }],
      urls: [{ url: 'https://example.com', title: 'Web' }]
    })

    expect(screen.queryByText(/No link/)).toBeNull()
  })

  it('imports nothing from the cozy backend', () => {
    // Guarded transitively by viewLayerPurity.spec.ts; asserted here too so a
    // regression fails next to the component it breaks.
    const src = require('fs').readFileSync(
      require('path').join(__dirname, 'Sources.jsx'),
      'utf8'
    )
    expect(src).not.toMatch(/from 'cozy-(client|flags|realtime)/)
  })
})
