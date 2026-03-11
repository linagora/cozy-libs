import LinkRecipient from './LinkRecipient'

const meta = {
  component: LinkRecipient,
  args: {
    recipientConfirmationData: false,
    verifyRecipient: () => true,
    fadeIn: false
  }
}

export default meta

export const Default = {
  name: 'Default'
}
