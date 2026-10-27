import LinkRecipientPermissions from './LinkRecipientPermissions'

const meta = {
  component: LinkRecipientPermissions,
  args: {
    document: { _id: '123' },
    documentType: 'Files',
    permissions: [],
    onUpdateLinkPermissions: () => {},
    onRevokeLink: () => {}
  }
}

export default meta

export const Default = {
  name: 'Default',
  args: {}
}
