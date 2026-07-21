import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { ShareLinkAccessModal } from './ShareLinkAccessModal'
import { useSharingContext } from '../../hooks/useSharingContext'

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: jest.fn()
}))

jest.mock('../../hoc/withLocales', () => Component => props => (
  <Component {...props} />
))

jest.mock('cozy-ui/transpiled/react/CozyDialogs', () => ({
  ConfirmDialog: ({ title, content, actions, onBack, onClose, size }) => (
    <div role="dialog" data-size={size}>
      {onBack && <button onClick={onBack}>Back</button>}
      {onClose && <button onClick={onClose}>Close</button>}
      <div>{title}</div>
      <div>{content}</div>
      <div>{actions}</div>
    </div>
  )
}))

jest.mock('cozy-ui/transpiled/react/DropdownButton', () => {
  const mockReact = require('react')

  return {
    __esModule: true,
    default: mockReact.forwardRef(
      ({ children, onClick, disabled, 'aria-label': ariaLabel }, ref) => (
        <button
          ref={ref}
          aria-label={ariaLabel}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </button>
      )
    )
  }
})

jest.mock('cozy-ui/transpiled/react/Menu', () => ({
  __esModule: true,
  default: ({ open, children }) =>
    open ? <div role="menu">{children}</div> : null
}))

jest.mock('cozy-ui/transpiled/react/MenuItem', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  )
}))

jest.mock('cozy-ui/transpiled/react/DatePicker', () => ({
  __esModule: true,
  default: ({ label, value, onChange, disabled }) => (
    <input
      aria-label={label}
      type="date"
      value={value.toISOString().slice(0, 10)}
      onChange={event => onChange(new Date(event.target.value))}
      disabled={disabled}
    />
  )
}))

jest.mock('cozy-ui/transpiled/react/TextField', () => ({
  __esModule: true,
  default: ({ label, value, onChange, disabled }) => (
    <input
      aria-label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({
    t: key =>
      ({
        'ShareLinkAccessModal.title': 'Set link access',
        'ShareLinkAccessModal.introText':
          'Choose what recipients can do with these files.',
        'ShareLinkAccessModal.anyoneWithLink':
          'Allow anyone with the link to access',
        'ShareLinkAccessModal.settings': 'Sharing settings',
        'ShareLinkAccessModal.accessLevel': 'Access level',
        'ShareLinkAccessModal.viewer': 'Viewer',
        'ShareLinkAccessModal.editor': 'Editor',
        'ShareLinkAccessModal.cancel': 'Cancel',
        'ShareLinkAccessModal.addLinks': 'Add links',
        'ShareLinkAccessModal.settingsTitle': 'Sharing settings',
        'ShareLinkAccessModal.expiry': 'Set an expiration date',
        'ShareLinkAccessModal.expiryDate': 'Expiration date',
        'ShareLinkAccessModal.password': 'Require a password',
        'ShareLinkAccessModal.passwordLabel': 'Password',
        'ShareLinkAccessModal.passwordTooShort':
          'Password must contain at least 4 characters.',
        'ShareLinkAccessModal.error.persistence':
          'Could not save link permissions. Please try again.'
      })[key] || key
  })
}))

describe('ShareLinkAccessModal', () => {
  const documents = [
    { _id: 'file-id', name: 'invoice.pdf' },
    { _id: 'folder-id', name: 'Projects' }
  ]
  const onCancel = jest.fn()
  const onSuccess = jest.fn()
  const ensureSharingLink = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useSharingContext.mockReturnValue({ ensureSharingLink })
  })

  const renderModal = (overrides = {}) =>
    render(
      <ShareLinkAccessModal
        documents={documents}
        onCancel={onCancel}
        onSuccess={onSuccess}
        {...overrides}
      />
    )

  it('shows the selected documents with viewer access by default', () => {
    renderModal()

    expect(screen.getByRole('dialog')).toHaveTextContent('invoice.pdf')
    expect(screen.getByRole('dialog')).toHaveTextContent('Projects')
    expect(screen.getByText('invoice.pdf').parentElement).toHaveClass(
      'u-maw-100'
    )
    expect(screen.getByLabelText('Access level')).toHaveTextContent('Viewer')
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'small')
  })

  it('keeps document icons inside their chips', () => {
    const renderDocumentIcon = jest.fn(document => (
      <span data-testid={`icon-${document._id}`}>icon</span>
    ))

    renderModal({ renderDocumentIcon })

    expect(renderDocumentIcon).toHaveBeenNthCalledWith(1, documents[0], 18)
    expect(renderDocumentIcon).toHaveBeenNthCalledWith(2, documents[1], 18)
    expect(screen.getByTestId('icon-file-id').parentElement).toHaveClass(
      'u-flex',
      'u-ov-hidden'
    )
  })

  it('calls onCancel from the back button', () => {
    renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('preserves the access settings after returning from the settings screen', () => {
    renderModal()

    fireEvent.click(screen.getByLabelText('Access level'))
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sharing settings' }))
    fireEvent.click(screen.getByLabelText('Set an expiration date'))
    fireEvent.click(screen.getByLabelText('Require a password'))
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByLabelText('Access level')).toHaveTextContent('Editor')

    fireEvent.click(screen.getByRole('button', { name: 'Sharing settings' }))

    expect(screen.getByLabelText('Set an expiration date')).toBeChecked()
    expect(screen.getByLabelText('Require a password')).toBeChecked()
    expect(screen.getByLabelText('Password')).toHaveValue('secret')
  })

  it('requires a four-character password before adding links', () => {
    renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Sharing settings' }))
    fireEvent.click(screen.getByLabelText('Require a password'))
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'abc' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByRole('button', { name: 'Add links' })).toBeDisabled()
  })

  it('disables every main action while links are being saved', async () => {
    let resolveSharingLink
    ensureSharingLink.mockReturnValue(
      new Promise(resolve => {
        resolveSharingLink = resolve
      })
    )

    renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Add links' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      expect(
        screen.getByRole('button', { name: 'Sharing settings' })
      ).toBeDisabled()
      expect(screen.getByLabelText('Access level')).toBeDisabled()
    })

    resolveSharingLink({ documentId: 'file-id', url: 'https://first' })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })

  it('starts every link concurrently and returns ordered results', async () => {
    let resolveFirst
    let resolveSecond
    ensureSharingLink
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveFirst = resolve
        })
      )
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveSecond = resolve
        })
      )

    renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Add links' }))

    expect(ensureSharingLink).toHaveBeenCalledTimes(2)
    resolveSecond({ documentId: 'folder-id', url: 'https://second' })
    resolveFirst({ documentId: 'file-id', url: 'https://first' })

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith([
        { documentId: 'file-id', url: 'https://first' },
        { documentId: 'folder-id', url: 'https://second' }
      ])
    )
    expect(ensureSharingLink).toHaveBeenNthCalledWith(1, documents[0], {
      editingRights: 'readOnly',
      dateEnabled: false,
      selectedDate: null,
      passwordEnabled: false,
      password: ''
    })
  })

  it('keeps the draft open after a failed save so the user can retry', async () => {
    ensureSharingLink
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ documentId: 'file-id', url: 'https://first' })
      .mockResolvedValueOnce({ documentId: 'folder-id', url: 'https://second' })

    renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Add links' }))

    await waitFor(() =>
      expect(screen.getByRole('dialog')).toHaveTextContent(
        'Could not save link permissions. Please try again.'
      )
    )
    expect(onSuccess).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Add links' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })
})
