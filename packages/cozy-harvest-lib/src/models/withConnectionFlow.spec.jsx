import { render, screen, act } from '@testing-library/react'
import React from 'react'

import CozyClient from 'cozy-client'

import ConnectionFlow from './ConnectionFlow'
import withConnectionFlow from './withConnectionFlow'

const konnectorFixture = {
  slug: 'boursorama83',
  parameters: {
    bankId: '100000'
  },
  partnership: {
    domain: 'https://budget-insight.com'
  }
}

const realtimeMock = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
}

const DumbTriggerStatus = ({ flowState }) => {
  return <div>{flowState.status.toString()}</div>
}

const TriggerStatus = withConnectionFlow()(DumbTriggerStatus)

describe('with connection flow', () => {
  it('should update correctly', () => {
    const client = new CozyClient({})
    client.plugins = { realtime: realtimeMock }
    const flow = new ConnectionFlow(client, null, konnectorFixture)
    render(<TriggerStatus flow={flow} />)
    expect(screen.getByText('IDLE')).toBeInTheDocument()
    act(() => {
      flow.setState({ status: 'SUCCESS' })
    })
    expect(screen.getByText('SUCCESS')).toBeInTheDocument()
  })
})
