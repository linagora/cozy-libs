import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import { setReadWriteSharedPermission } from './setReadWriteSharedPermission'
import AppLike from '../../../../test/AppLike'

const mockT = key => {
  const translations = {
    'Share.type.one-way': 'Can view',
    'Share.type.two-way': 'Can change'
  }
  return translations[key] || key
}

describe('setReadWriteSharedPermission', () => {
  let setType

  beforeEach(() => {
    setType = jest.fn()
  })

  it('should return correct action structure', () => {
    const action = setReadWriteSharedPermission({
      t: mockT,
      type: 'two-way',
      setType
    })

    expect(action.name).toBe('setReadWriteSharedPermission')
    expect(action.label).toBe('Can change')
    expect(action.icon).toBeNull()
  })

  it('should call setType with two-way when action is triggered', () => {
    const action = setReadWriteSharedPermission({
      t: mockT,
      type: 'one-way',
      setType
    })

    action.action()

    expect(setType).toHaveBeenCalledWith('two-way')
  })

  it('should render radio as checked when type is two-way', () => {
    const { Component } = setReadWriteSharedPermission({
      t: mockT,
      type: 'two-way',
      setType
    })

    render(
      <AppLike>
        <Component />
      </AppLike>
    )

    expect(screen.getByRole('radio')).toBeChecked()
  })

  it('should render radio as unchecked when type is one-way', () => {
    const { Component } = setReadWriteSharedPermission({
      t: mockT,
      type: 'one-way',
      setType
    })

    render(
      <AppLike>
        <Component />
      </AppLike>
    )

    expect(screen.getByRole('radio')).not.toBeChecked()
  })

  it('should call setType with two-way when the component is clicked', () => {
    const { Component } = setReadWriteSharedPermission({
      t: mockT,
      type: 'one-way',
      setType
    })

    render(
      <AppLike>
        <Component />
      </AppLike>
    )

    fireEvent.click(screen.getByText('Can change'))

    expect(setType).toHaveBeenCalledWith('two-way')
  })
})
