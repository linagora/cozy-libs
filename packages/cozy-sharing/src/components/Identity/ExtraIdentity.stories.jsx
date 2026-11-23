import { recipients } from '../../../.storybook/fixtures/recipients'
import { ExtraIdentity } from './ExtraIdentity'

const meta = {
  component: ExtraIdentity,
  args: {
    extraRecipients: recipients
  }
}

export default meta

export const Default = {
  name: 'Default',
  args: {}
}
