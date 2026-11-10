import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { ActivityReportContext } from './ActivityReportContext'
import { ShareRestrictionModal } from './ShareRestrictionModal'
import { READ_ONLY_PERMS, WRITE_PERMS } from './helpers'
import AppLike from '../../../test/AppLike'

const mockUpdateDocumentPermissions = jest.fn()
const mockShareByLink = jest.fn()
let mockLink = null
let mockPermissions = []
let mockDocumentType = 'Files'

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    documentType: mockDocumentType,
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
    mockDocumentType = 'Files'
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn(), write: jest.fn() }
    })
  })

  const setup = ({ sharedFile = file, enableActivityReport = true } = {}) =>
    render(
      <AppLike client={client}>
        <ActivityReportContext.Provider value={enableActivityReport}>
          <ShareRestrictionModal file={sharedFile} onClose={jest.fn()} />
        </ActivityReportContext.Provider>
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
      name: 'Send report with link statistics via email'
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
      name: 'Send report with link statistics via email'
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
      screen.getByRole('checkbox', {
        name: 'Send report with link statistics via email'
      })
    ).not.toBeChecked()
  })

  it.each([true, false])(
    'respects report opt-in with a non-Files locale namespace (%s)',
    enabled => {
      mockDocumentType = 'Document'
      mockLink = null
      mockPermissions = []
      setup({ enableActivityReport: enabled })
      const report = screen.queryByRole('checkbox', {
        name: 'Send report with link statistics via email'
      })
      if (enabled) {
        expect(report).toBeInTheDocument()
        expect(report).toBeDisabled()
        fireEvent.click(
          screen.getByRole('checkbox', {
            name: 'Remove access after a deadline'
          })
        )
        expect(report).toBeEnabled()
      } else {
        expect(report).toBeNull()
      }
    }
  )

  it.each([true, false])(
    'preserves hidden report settings when disabling the deadline (visible: %s)',
    async enabled => {
      mockLink = 'url'
      mockPermissions = [linkPermission(READ_ONLY_PERMS)]
      mockPermissions[0].attributes.expires_at = new Date(
        Date.now() + 86400000
      ).toISOString()
      mockPermissions[0].attributes.activity_report_enabled = true
      mockUpdateDocumentPermissions.mockResolvedValue([
        { data: mockPermissions[0] }
      ])
      setup({ enableActivityReport: enabled })
      const report = () =>
        screen.queryByRole('checkbox', {
          name: 'Send report with link statistics via email'
        })
      if (enabled) expect(report()).toBeChecked()
      else expect(report()).toBeNull()
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Remove access after a deadline' })
      )
      if (enabled) {
        expect(report()).not.toBeChecked()
        expect(report()).toBeDisabled()
      }
      fireEvent.click(screen.getByText('Confirm'))
      await waitFor(() =>
        expect(mockUpdateDocumentPermissions).toHaveBeenCalled()
      )
      const options = mockUpdateDocumentPermissions.mock.calls[0][1]
      if (enabled) expect(options.activityReportEnabled).toBe(false)
      else expect(options.activityReportEnabled).toBeUndefined()
    }
  )

  it('requires an expiry to enable a report for files and folders', () => {
    mockLink = null
    mockPermissions = []
    const { unmount } = setup()
    expect(
      screen.getByRole('checkbox', {
        name: 'Send report with link statistics via email'
      })
    ).toBeDisabled()
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Remove access after a deadline' })
    )
    expect(
      screen.getByRole('checkbox', {
        name: 'Send report with link statistics via email'
      })
    ).toBeEnabled()
    unmount()
    setup({ sharedFile: { ...file, type: 'directory' } })
    expect(
      screen.getByRole('checkbox', {
        name: 'Send report with link statistics via email'
      })
    ).toBeDisabled()
  })

  it('creates a link without expiry and report consent', async () => {
    mockLink = null
    mockPermissions = []
    mockShareByLink.mockResolvedValue({
      data: linkPermission(READ_ONLY_PERMS)
    })
    setup()
    const report = screen.getByRole('checkbox', {
      name: 'Send report with link statistics via email'
    })
    expect(report).toBeDisabled()
    expect(report).not.toBeChecked()
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(mockShareByLink).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ activityReportEnabled: false })
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
