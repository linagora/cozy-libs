import PropTypes from 'prop-types'
import React from 'react'

import Box from 'cozy-ui/transpiled/react/Box'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { DialogContent } from 'cozy-ui/transpiled/react/Dialog'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import { translate } from 'twake-i18n'

import AccountsListItem from './AccountsListItem'

export class AccountsList extends React.PureComponent {
  render() {
    const { accounts, konnector, addAccount, onPick, t } = this.props

    return (
      <DialogContent className="u-pb-2 u-pt-0 u-ph-0">
        <ul className="u-nolist u-p-0 u-m-0">
          {accounts.map((account, index) => (
            <li key={index} className="u-mb-half">
              <AccountsListItem
                account={account.account}
                konnector={konnector}
                trigger={account.trigger}
                onClick={() => onPick(account)}
              />
            </li>
          ))}
          <li className="u-mb-half">
            <Box
              display="block"
              border={1}
              borderColor="var(--dividerColor)"
              borderRadius={8}
              padding={0}
            >
              <Button
                label={t('modal.addAccount.button')}
                variant="text"
                fullWidth
                icon={<Icon icon={PlusIcon} />}
                className="u-bdrs-4"
                onClick={addAccount}
              />
            </Box>
          </li>
        </ul>
      </DialogContent>
    )
  }
}

AccountsList.propTypes = {
  accounts: PropTypes.array.isRequired,
  konnector: PropTypes.shape({
    name: PropTypes.string,
    vendor_link: PropTypes.string
  }).isRequired,
  addAccount: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export default translate()(AccountsList)
