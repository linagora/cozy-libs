import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import { setReadOnlySharedPermission } from './setReadOnlySharedPermission'
import AppLike from '../../../../test/AppLike'

const mockT = key => {
  const translations = {
    'Share.type.one-way': 'Can view',
    'Share.type.two-way': 'Can change'
  }
  return translations[key] || key
}

describe('setReadOnlySharedPermission', () => {
  let setType

  beforeEach(() => {
    setType = jest.fn()
  })

  it('should return correct action structure', () => {
    const action = setReadOnlySharedPermission({
      t: mockT,
      type: 'one-way',
      setType
    })

    expect(action.name).toBe('setReadOnlySharedPermission')
    expect(action.label).toBe('Can view')
    expect(action.icon).toBeNull()
  })

  it('should call setType with one-way when action is triggered', () => {
    const action = setReadOnlySharedPermission({
      t: mockT,
      type: 'two-way',
      setType
    })

    action.action()

    expect(setType).toHaveBeenCalledWith('one-way')
  })

  it('should render radio as checked when type is one-way', () => {
    const { Component } = setReadOnlySharedPermission({
      t: mockT,
      type: 'one-way',
      setType
    })

    render(
      <AppLike>
        <Component />
      </AppLike>
    )

    expect(screen.getByRole('radio')).toBeChecked()
  })

  it('should render radio as unchecked when type is two-way', () => {
    const { Component } = setReadOnlySharedPermission({
      t: mockT,
      type: 'two-way',
      setType
    })

    render(
      <AppLike>
        <Component />
      </AppLike>
    )

    expect(screen.getByRole('radio')).not.toBeChecked()
  })

  it('should call setType with one-way when the component is clicked', () => {
    const { Component } = setReadOnlySharedPermission({
      t: mockT,
      type: 'two-way',
      setType
    })

    render(
      <AppLike>
        <Component />
      </AppLike>
    )

    fireEvent.click(screen.getByText('Can view'))

    expect(setType).toHaveBeenCalledWith('one-way')
  })
})
