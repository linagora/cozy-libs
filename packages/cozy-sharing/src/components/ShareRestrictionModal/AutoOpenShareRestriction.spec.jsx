import { render } from '@testing-library/react'
import React from 'react'

import flag from 'cozy-flags'

import { AutoOpenShareRestriction } from './AutoOpenShareRestriction'

jest.mock('./ShareRestrictionModal', () => ({
  ShareRestrictionModal: () => <div>ShareRestrictionModal</div>
}))

jest.mock('cozy-flags')

describe('AutoOpenShareRestriction', () => {
  const file = { _id: 'abc' }

  beforeEach(() => {
    flag.mockImplementation(() => null)
  })

  it('should render nothing when flag is off', () => {
    const { queryByText } = render(<AutoOpenShareRestriction file={file} />)

    expect(queryByText('ShareRestrictionModal')).toBeNull()
  })

  it('should render nothing when a link already exists', () => {
    flag.mockImplementation(
      name => name === 'sharing.auto-open-settings.enabled'
    )

    const { queryByText } = render(
      <AutoOpenShareRestriction file={file} link="https://x" />
    )

    expect(queryByText('ShareRestrictionModal')).toBeNull()
  })

  it('should render ShareRestrictionModal when flag is on and no link', () => {
    flag.mockImplementation(
      name => name === 'sharing.auto-open-settings.enabled'
    )

    const { getByText } = render(<AutoOpenShareRestriction file={file} />)

    expect(getByText('ShareRestrictionModal'))
  })
})
