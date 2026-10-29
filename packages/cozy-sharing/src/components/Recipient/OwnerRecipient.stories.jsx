import { recipients } from '../../../.storybook/fixtures/recipients'
import OwnerRecipient from './OwnerRecipient'

const meta = {
  component: OwnerRecipient,
  args: {
    owner: recipients.find(recipient => recipient.status === 'owner')
  }
}

export default meta

export const Default = {
  name: 'Default',
  args: {}
}
