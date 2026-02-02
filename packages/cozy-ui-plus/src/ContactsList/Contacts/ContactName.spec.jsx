import { render, screen } from '@testing-library/react'
import React from 'react'

import { getDisplayName } from 'cozy-client/dist/models/contact'

import ContactName from './ContactName'

jest.mock('cozy-client/dist/models/contact', () => ({
  getDisplayName: jest.fn()
}))

const makeContact = attrs => ({
  _id: 'contactid',
  _type: 'io.cozy.contacts',
  ...attrs
})

describe('ContactName', () => {
  it('should bold single-word family name', () => {
    getDisplayName.mockReturnValue('John Doe')
    const contact = makeContact({
      name: { familyName: 'Doe', givenName: 'John' }
    })

    render(<ContactName contact={contact} />)

    const boldElement = document.querySelector('.u-fw-bold')
    expect(boldElement).toHaveTextContent('Doe')
  })

  it('should bold multi-word family name', () => {
    getDisplayName.mockReturnValue('khaled Van Beethoven')
    const contact = makeContact({
      name: { familyName: 'Van Beethoven', givenName: 'khaled' }
    })

    render(<ContactName contact={contact} />)

    const boldElement = document.querySelector('.u-fw-bold')
    expect(boldElement).toHaveTextContent('Van Beethoven')
  })

  it('should not bold anything when familyName is missing', () => {
    getDisplayName.mockReturnValue('johndoe@localhost')
    const contact = makeContact()

    render(<ContactName contact={contact} />)

    const boldElement = document.querySelector('.u-fw-bold')
    expect(boldElement).toBeNull()
    expect(screen.getByText('johndoe@localhost')).toBeInTheDocument()
  })

  it('should not bold when displayName does not end with familyName', () => {
    getDisplayName.mockReturnValue('johndoe@localhost')
    const contact = makeContact({
      name: { familyName: 'Doe' }
    })

    render(<ContactName contact={contact} />)

    const boldElement = document.querySelector('.u-fw-bold')
    expect(boldElement).toBeNull()
  })

  it('should handle contact without name property', () => {
    getDisplayName.mockReturnValue('johndoe@localhost')
    const contact = makeContact()

    render(<ContactName contact={contact} />)

    expect(screen.getByText('johndoe@localhost')).toBeInTheDocument()
  })

  it('should display name prefix before bolded family name', () => {
    getDisplayName.mockReturnValue('khaled Van Beethoven')
    const contact = makeContact({
      name: { familyName: 'Van Beethoven', givenName: 'khaled' }
    })

    render(<ContactName contact={contact} />)

    const nameElement = screen.getByTestId('ContactName')
    expect(nameElement).toHaveTextContent('khaled')
    expect(nameElement).toHaveTextContent('Van Beethoven')
  })

  it('should bold family name even with trailing whitespace in displayName', () => {
    getDisplayName.mockReturnValue('John Doe  ')
    const contact = makeContact({
      name: { familyName: 'Doe', givenName: 'John' }
    })

    render(<ContactName contact={contact} />)

    const boldElement = document.querySelector('.u-fw-bold')
    expect(boldElement).toHaveTextContent('Doe')
  })
})
