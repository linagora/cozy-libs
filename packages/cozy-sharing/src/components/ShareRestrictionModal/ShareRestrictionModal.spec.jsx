import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { ShareRestrictionModal } from './ShareRestrictionModal'
import { READ_ONLY_PERMS, WRITE_PERMS } from './helpers'
import AppLike from '../../../test/AppLike'

const mockUpdateDocumentPermissions = jest.fn()
const mockShareByLink = jest.fn()
let mockLink = null
let mockPermissions = []

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    documentType: 'Files',
    getDocumentPermissions: () => mockPermissions,
    getSharingLink: () => mockLink,
    updateDocumentPermissions: mockUpdateDocumentPermissions,
    shareByLink: mockShareByLink,
    getOwner: () => ({ instance: 'https://owner.cozy.example' }),
    getSharingById: () => ({ rules: [{ values: ['drive-root'] }] })
  })
}))

const linkPermission = verbs => ({
  attributes: {
    permissions: { files: { verbs } },
    shortcodes: { code: 'code' }
  }
})

describe('ShareRestrictionModal', () => {
  const client = createMockClient({})
  client.capabilities = { flat_subdomains: true }
  client.getStackClient = () => ({ uri: 'https://me.cozy.example' })
  const file = { _id: 'file-1', name: 'file.txt' }

  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn(), write: jest.fn() }
    })
  })

  const setup = ({ sharedFile = file } = {}) =>
    render(
      <AppLike client={client}>
        <ShareRestrictionModal file={sharedFile} onClose={jest.fn()} />
      </AppLike>
    )

  it('persists the report choice and restores it on reopening the settings', async () => {
    mockLink = 'url'
    mockPermissions = [linkPermission(READ_ONLY_PERMS)]
    mockPermissions[0].attributes.expires_at = new Date(
      Date.now() + 86400000
    ).toISOString()
    mockUpdateDocumentPermissions.mockImplementation(async (_file, options) => {
      mockPermissions[0].attributes.activity_report_enabled =
        options.activityReportEnabled
      return [{ data: mockPermissions[0] }]
    })

    const { unmount } = setup()
    const reportSwitch = screen.getByRole('checkbox', {
      name: 'Email an expiration report'
    })
    expect(reportSwitch).not.toBeChecked()
    fireEvent.click(reportSwitch)
    expect(reportSwitch).toBeChecked()
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(mockPermissions[0].attributes.activity_report_enabled).toBe(true)
    )

    unmount()
    const reopened = setup()
    const savedReportSwitch = screen.getByRole('checkbox', {
      name: 'Email an expiration report'
    })
    expect(savedReportSwitch).toBeChecked()
    fireEvent.click(savedReportSwitch)
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(mockPermissions[0].attributes.activity_report_enabled).toBe(false)
    )
    reopened.unmount()
    setup()
    expect(
      screen.getByRole('checkbox', { name: 'Email an expiration report' })
    ).not.toBeChecked()
  })

  it('requires an expiry to enable a report and does not offer one for folders', () => {
    mockLink = null
    mockPermissions = []
    const { unmount } = setup()
    expect(
      screen.getByRole('checkbox', { name: 'Email an expiration report' })
    ).toBeDisabled()
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Remove access after a deadline' })
    )
    expect(
      screen.getByRole('checkbox', { name: 'Email an expiration report' })
    ).toBeEnabled()
    unmount()
    setup({ sharedFile: { ...file, type: 'directory' } })
    expect(
      screen.queryByRole('checkbox', { name: 'Email an expiration report' })
    ).toBe(null)
  })

  it('passes an opt-in for a new shared drive file', async () => {
    mockLink = null
    mockPermissions = []
    mockShareByLink.mockResolvedValue({
      data: linkPermission(READ_ONLY_PERMS)
    })
    const sharedFile = { ...file, driveId: 'drive-1' }
    setup({ sharedFile })
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Remove access after a deadline' })
    )
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Email an expiration report' })
    )
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(mockShareByLink).toHaveBeenCalledWith(
        sharedFile,
        expect.objectContaining({ activityReportEnabled: true })
      )
    )
  })

  it('keeps editor rights when the settings of an editor link change', async () => {
    mockLink = 'url'
    mockPermissions = [linkPermission(WRITE_PERMS)]
    mockUpdateDocumentPermissions.mockResolvedValue([
      { data: linkPermission(WRITE_PERMS) }
    ])
    setup()
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(mockUpdateDocumentPermissions).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ verbs: WRITE_PERMS })
      )
    )
  })

  it('creates a viewer link when the settings are confirmed without link', async () => {
    mockLink = null
    mockPermissions = []
    mockShareByLink.mockResolvedValue({
      data: linkPermission(READ_ONLY_PERMS)
    })
    setup()
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(mockShareByLink).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ verbs: READ_ONLY_PERMS })
      )
    )
  })

  it("copies a shared drive link from the drive owner's instance", async () => {
    mockLink = null
    mockPermissions = []
    mockShareByLink.mockResolvedValue({
      data: linkPermission(READ_ONLY_PERMS)
    })
    setup({ sharedFile: { ...file, driveId: 'drive-1' } })
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('https://owner-drive.cozy.example/')
      )
    )
  })
})
