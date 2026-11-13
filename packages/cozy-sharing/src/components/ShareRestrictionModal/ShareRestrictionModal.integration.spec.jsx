import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { endOfDay } from 'date-fns'
import React, { useState } from 'react'

import { createMockClient } from 'cozy-client'

import { ActivityReportContext } from './ActivityReportContext'
import { ShareRestrictionModal } from './ShareRestrictionModal'
import AppLike from '../../../test/AppLike'
import { SharingProvider } from '../../SharingProvider'
import { addSharingLink } from '../../state'

const file = { _id: 'file-1', id: 'file-1', name: 'file.txt' }
const expiry = '2099-01-01T23:59:59.999Z'

function makePermission(id, report) {
  return {
    id,
    type: 'io.cozy.permissions',
    attributes: {
      permissions: {
        files: { type: 'io.cozy.files', verbs: ['GET'], values: [file.id] }
      },
      shortcodes: { code: `code-${id}` },
      expires_at: expiry,
      ...(report !== undefined && { activity_report_enabled: report })
    }
  }
}

function Settings({ document, enabled = true }) {
  const [open, setOpen] = useState(false)
  return open ? (
    <ActivityReportContext.Provider value={enabled}>
      <ShareRestrictionModal file={document} onClose={() => setOpen(false)} />
    </ActivityReportContext.Provider>
  ) : (
    <button onClick={() => setOpen(true)}>Reopen settings</button>
  )
}

describe('sharing restriction consent with multiple links', () => {
  it.each([
    [false, true, false, null, [true, false]],
    [false, false, true, null, [false, true]],
    [false, false, false, 'toggle', [true, false]],
    [false, true, true, 'toggle', [false, true]],
    [false, true, undefined, null, [true, undefined]],
    [true, true, false, null, [true, false]],
    [true, false, true, null, [false, true]],
    [true, false, false, 'toggle', [true, false]],
    [true, true, true, 'toggle', [false, true]],
    [true, true, undefined, null, [true, undefined]],
    [false, true, false, 'change expiry', [true, false]],
    [true, false, true, 'change expiry', [false, true]],
    [false, true, false, 'remove expiry', [true, false]],
    [true, true, false, 'remove expiry', [true, false]],
    [false, false, true, 'toggle', [true, true], true],
    [true, true, false, 'toggle', [false, false], true],
    [true, true, undefined, null, [true, undefined], true],
    [true, false, true, 'cancel', [false, true], true],
    [false, true, false, 'hidden', [true, false]],
    [true, false, true, 'hidden', [false, true], true],
    [false, undefined, true, 'hidden', [undefined, true]]
  ])(
    'preserves per-link consent (drive=%s, initial=%s/%s, action=%s)',
    async (drive, first, second, action, expected, directory = false) => {
      const document = {
        ...file,
        ...(drive && { driveId: 'drive-1' }),
        ...(directory && { type: 'directory' })
      }
      const stored = Object.fromEntries(
        [makePermission('first', first), makePermission('second', second)].map(
          permission => [permission.id, permission]
        )
      )
      const add = async (permission, rules, options) => {
        const current = stored[permission.id]
        stored[permission.id] = {
          ...current,
          attributes: {
            ...current.attributes,
            permissions: rules,
            expires_at: options.expiresAt,
            ...(Object.hasOwn(options, 'activityReportEnabled') && {
              activity_report_enabled: options.activityReportEnabled
            })
          }
        }
        return { data: stored[permission.id] }
      }
      const client = createMockClient({})
      client.capabilities = { flat_subdomains: true }
      client.getStackClient = () => ({ uri: 'https://me.cozy.example' })
      client.collection = () => ({ add })
      Object.assign(navigator, {
        clipboard: { writeText: jest.fn(), write: jest.fn() }
      })
      const providerRef = React.createRef()
      render(
        <AppLike client={client}>
          <SharingProvider
            client={client}
            documentType="Files"
            ref={providerRef}
          >
            <Settings document={document} enabled={action !== 'hidden'} />
          </SharingProvider>
        </AppLike>
      )
      act(() => {
        providerRef.current.dispatch(addSharingLink(Object.values(stored)))
      })
      fireEvent.click(screen.getByText('Reopen settings'))
      if (action === 'toggle' || action === 'cancel') {
        fireEvent.click(
          screen.getByRole('checkbox', {
            name: 'Send report with link statistics via email'
          })
        )
      } else if (action === 'change expiry') {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: '01/15/2099' }
        })
      } else if (action === 'remove expiry') {
        fireEvent.click(
          screen.getByRole('checkbox', {
            name: 'Remove access after a deadline'
          })
        )
      }
      if (action === 'cancel') {
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
      } else {
        fireEvent.click(screen.getByText('Confirm'))
      }
      await screen.findByText('Reopen settings')
      const permissions = providerRef.current.state.getDocumentPermissions(
        file.id
      )
      expect(
        permissions.map(p => p.attributes.activity_report_enabled)
      ).toEqual(expected)
      if (second === undefined) {
        expect(permissions[1].attributes).not.toHaveProperty(
          'activity_report_enabled'
        )
      }
      const expectedExpiry =
        action === 'cancel'
          ? expiry
          : action === 'remove expiry'
            ? ''
            : endOfDay(
                action === 'change expiry'
                  ? new Date(2099, 0, 15)
                  : new Date(expiry)
              ).toISOString()
      expect(permissions.map(p => p.attributes.expires_at)).toEqual([
        expectedExpiry,
        expectedExpiry
      ])
      fireEvent.click(screen.getByText('Reopen settings'))
      if (action === 'hidden') {
        expect(
          screen.queryByRole('checkbox', {
            name: 'Send report with link statistics via email'
          })
        ).toBeNull()
        return
      }
      await waitFor(() => {
        const report = screen.getByRole('checkbox', {
          name: 'Send report with link statistics via email'
        })
        expect(report.checked).toBe(expected[0])
      })
    }
  )
})
