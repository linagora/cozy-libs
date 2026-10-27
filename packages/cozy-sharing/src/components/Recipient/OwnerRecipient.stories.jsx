import OwnerRecipient from './OwnerRecipient'
import { recipients } from '../../../.storybook/fixtures/recipients'

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
