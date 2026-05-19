import LinkRecipient from './LinkRecipient'

const meta = {
  component: LinkRecipient,
  args: {
    recipientConfirmationData: false,
    verifyRecipient: () => true,
    document: { _id: '123' },
    fadeIn: false
  }
}

export default meta

export const Default = {
  name: 'Default'
}
