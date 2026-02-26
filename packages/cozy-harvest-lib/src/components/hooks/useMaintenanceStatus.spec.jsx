import { renderHook } from '@testing-library/react-hooks'
import React from 'react'

import { CozyProvider, createMockClient, useQuery } from 'cozy-client'
import flag from 'cozy-flags'

import useMaintenanceStatus from './useMaintenanceStatus'

jest.mock('cozy-client', () => {
  const actual = jest.requireActual('cozy-client')
  return {
    ...actual,
    useQuery: jest.fn()
  }
})

jest.mock('cozy-flags')

describe('useMaintenanceStatus', () => {
  const setup = (slug = 'test') => {
    const mockClient = createMockClient()
    const wrapper = ({ children }) => (
      <CozyProvider client={mockClient}>{children}</CozyProvider>
    )
    return renderHook(() => useMaintenanceStatus(slug), { wrapper })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return maintenance status of registry konnector', async () => {
    useQuery.mockReturnValue({
      data: {
        maintenance_activated: true,
        maintenance_options: {
          messages: {
            en: 'Maintenance in progress'
          }
        }
      },
      fetchStatus: 'loaded',
      lastError: null
    })
    const { result } = setup()

    expect(result.current.fetchStatus).toBe('loaded')
    expect(result.current.data.isInMaintenance).toBe(true)
    expect(result.current.data.messages).toEqual({
      en: 'Maintenance in progress'
    })
    expect(result.current.lastError).toBe(null)
  })

  it('should not be consider under maintenance if the slug is not found', async () => {
    useQuery.mockReturnValue({
      data: null,
      fetchStatus: 'failed',
      lastError: new Error('Failed to found konnector')
    })
    const { result } = setup('not-found')

    expect(result.current.fetchStatus).toBe('failed')
    expect(result.current.data.isInMaintenance).toBe(false)
    expect(result.current.data.messages).toEqual({})
    expect(result.current.lastError).toEqual(
      new Error('Failed to found konnector')
    )
  })

  it('should not be consider under maintenance if the slug is declared in the skip flag', async () => {
    flag.mockReturnValue(['test'])
    useQuery.mockReturnValue({
      data: {
        maintenance_activated: true,
        maintenance_options: {
          messages: {
            en: 'Maintenance in progress'
          }
        }
      },
      fetchStatus: 'loaded',
      lastError: null
    })

    const { result } = setup()

    expect(result.current.fetchStatus).toBe('loaded')
    expect(result.current.data.isInMaintenance).toBe(false)
    expect(result.current.data.messages).toEqual({})
    expect(result.current.lastError).toBe(null)
  })
})
