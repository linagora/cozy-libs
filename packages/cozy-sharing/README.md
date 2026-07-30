# cozy-sharing

React library that provides sharing UI and logic for Cozy / Twake Drive applications.

It wraps the Cozy Stack sharing API and exposes ready-to-use components (modal, button, banners), hooks, and context for building sharing experiences.

***

## Installation

```bash
yarn add cozy-sharing
```

In your app, you must:

- wrap the component tree with `SharingProvider`
- import the stylesheet: `import 'cozy-sharing/dist/stylesheet.css'`

***

## Usage

### Provider

```jsx
import SharingProvider from 'cozy-sharing'

<SharingProvider doctype="io.cozy.files" documentType="Files">
  <App />
</SharingProvider>
```

**Props:**

| Prop | Required | Description |
|------|----------|-------------|
| `doctype` | yes | The cozy doctype (e.g. `io.cozy.files`) |
| `documentType` | no | Human-readable type for i18n keys (default `'Document'`) |
| `onShared` | no | Callback fired after a share is created |
| `isPublic` | no | Set to `true` when rendering a public page (disables fetching) |
| `previewPath` | no | Custom preview path sent to the share creation |

### Built-in components

Surrounding application code (imports, state, props) is omitted for brevity.

```jsx
import { ShareModal } from 'cozy-sharing'

const ToggleModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Share</Button>
      {isOpen && <ShareModal document={doc} onClose={() => setIsOpen(false)} />}
    </div>
  )
}
```

### Render-prop components

```jsx
import { SharedDocument } from 'cozy-sharing'

const MyComp = () => (
  <SharedDocument docId="123">
    {({ isShared, link }) => (isShared ? link : 'Not shared yet')}
  </SharedDocument>
)
```

### Hooks

```jsx
import { useSharingContext } from 'cozy-sharing'

const MyComp = () => {
  const { share } = useSharingContext()
  return <Button onClick={() => share({ document, recipients, ... })}>Share</Button>
}
```

***

## How it works

### Permission model

The UI exposes two roles, but the stack has more granular verb control:

| Role | Verbs | Description |
|------|-------|-------------|
| **Viewer** | `GET` | Read-only access |
| **Editor** | `GET, POST, PUT, PATCH` | Read + write + share management |

The `write` permission allows editing content, uploading files, deleting files (to the owner's trash), and managing share members (add/remove members, change permissions, view/manage link).

### Link sharing (public URL)

Creates a public URL accessible without a Twake account. One link per resource at any time.

**Options (set in `ShareRestrictionModal` or `ShareLinkAccessModal`):**

| Option | Default | Details |
|--------|---------|---------|
| Permission | `readOnly` | Can be changed to `write` |
| Expiration date | Off | Toggle; defaults to 30 days ahead when enabled; expires at end of that day |
| Password | Off | Minimum 4 characters; owner communicates it out-of-band |

**Lifecycle:**

- Deactivating a link revokes the current permissions. Reactivating generates a **new URL** — the old one stays invalid.
- Deleting the root resource revokes all associated shares (link and email).
- Link sharing coexists with email sharing on the same resource.

### Email sharing (cozy-to-cozy)

Invites specific users or groups with individualized permissions. Two technical modes:

- **Cozy-to-cozy sharing** (classic) — data is **replicated** to each recipient's Cozy.
- **Shared drives** (shared folders, team drives) — recipients access files at the **owner's instance** (no replication).

In both cases, content appears in the recipient's **Sharing tab**.

**By recipient status:**

| Recipient status | Behavior |
|-----------------|----------|
| Trusted contact (same org or previously accepted) | Content appears directly in the Sharing tab; notification sent |
| Has Twake account, not in contacts | Invitation email → login → Sharing tab |
| **No Twake account** | ❌ Not supported today |
| **Different SSO** | ❌ Not supported today |
| Not trusted (guest in org) | ❌ Only if added manually; not automated today |

### Cohabitation

Link and email sharing can coexist on the same resource. The recipient's permission is the most permissive when both apply.

***

## Feature conditions

### Link sharing

| Condition | Rule | Source |
|-----------|------|--------|
| Who can create/manage | Owner or Editor (`canReshare` = owner, or `open_sharing && !read_only`) | `canReshare()` in `state.js` |
| Document type restriction | Hidden when `documentType === 'Organizations'` | `ShareModal.jsx:33` |
| Albums | Link-only, read-only permissions only | `ShareModal.jsx:30`, `link.js:3` |
| Editing rights box | Hidden when `drive.federated-shared-folder.enabled` flag is true | `BoxEditingRights.jsx:54` |
| Expiration date toggle default | Controlled by `sharing.date-toggle.enabled` flag (default: false) | `ShareRestrictionModal.jsx:62` |
| Link deactivation | Revokes the permission document; regenerates a new URL on reactivation | `SharingProvider.jsx:635` |
| Password | 4+ characters; no limit on attempts | `ShareLinkSettings.jsx:10` |
| Guest access | Via `/public` URL with `sharecode`; no auth required | `helpers.js:106` |

### Email sharing

| Condition | Rule | Source |
|-----------|------|--------|
| Who can share | Owner or Editor (`canReshare`) | `SharingProvider.jsx` |
| **Core constraint** | Disabled if `hasSharedParent` OR `hasSharedChild` — a subfolder of an email-shared folder cannot be shared by email independently | `ShareModal.jsx:32`, `state.js:508-523` |
| Recipients limit | Default 100; overridable via `sharing.recipients-limit` flag | `helpers/recipients.js:33` |
| Recipient display mode | `sharing.show-recipient-groups` flag: `true` = groups as units, `false` = spread group members | `ShareByEmail.jsx:31` |
| Read-only sharing | If the existing sharing is read-only, only the `readOnly` option is offered | `ShareByEmail.jsx:46-57` |
| Contacts shown | Only contacts with a defined `email` or `cozy` URL | `helpers/recipients.js:72-73` |
| Group sharing | All members get the same permission; dynamic membership (add/remove) propagates | `state.js:414-451` |

### Shared drives & federated folders

| Condition | Rule | Source |
|-----------|------|--------|
| Org shared drive | `isOrgSharedDrive` = `sharing.drive === true && sharing.org_drive === true` | `state.js:324` |
| `canLeave` | `false` for org shared drives | `state.js:335` |
| `canReshare` | `!org_drive && !read_only` for drives; `open_sharing && !read_only` for folders | `state.js:342` |
| Federated folder modal | Enabled by `drive.federated-shared-folder.enabled` flag and `document.driveId` | `ShareModal.jsx:39` |
| Email sharing in federated folder | Disabled for files inside a federated shared folder (has `driveId` but is not the root) | `FederatedFolderModal.jsx:122-126` |
| Link sharing in federated folder | Uses `getFederatedShareLink` which resolves the owner's instance URL | `FederatedFolderModal.jsx:108-110` |
| Member view inside shared drive | Subfolder members see link management only (no member cross/perm). Root members with `canReshare` see full member management; read-only root members see link management only. | `FederatedFolderModal.jsx:118-133`, `SharingDetailsModal.jsx:38-39` |

### Share management

| Condition | Rule | Source |
|-----------|------|--------|
| Editable modal | `isEditable = !byDocId[doc] \|\| isOwner(doc) \|\| canReshare(doc)` | `ShareModal.jsx:35-36` |
| Non-editable view | `SharingDetailsModal` — read-only members (no cross/perm menu), with link management (gear + copy link) for shared drives | `ShareModal.jsx:53-62` |
| Updating member type | `updateSharingMemberType` calls `setReadOnly` / `setReadWrite` on the stack | `SharingProvider.jsx:361-420` |
| Revoke self | Available to all recipients | `SharingProvider.jsx:349-353` |
| Revoke group | Available to owner/editor; removes all group members at once | `SharingProvider.jsx:336-347` |

### Native mobile sharing

| Condition | Rule | Source |
|-----------|------|--------|
| Availability | Only in flagship app (`isFlagshipApp()`) when `shareFiles` intent is available | `NativeFileSharingProvider.jsx:26-27` |
| Restriction | Files only (not directories) | `shareNative.js:42` |

***

## Feature flags

| Flag | Default | Effect |
|------|---------|--------|
| `cozy.hide-sharing-cozy-to-cozy` | `false` | When `true`, hides cozy-to-cozy sharing entirely; only link sharing is available |
| `drive.federated-shared-folder.enabled` | `false` | Enables federated folder modal (shared drives across instances) |
| `sharing.date-toggle.enabled` | `false` | Default state of the expiration date toggle when creating a new link |
| `sharing.show-recipient-groups` | `false` | When `true`, groups are shown as distinct recipients; when `false`, group members are spread |
| `sharing.recipients-limit` | `100` | Maximum number of recipients per document |
| `signup-url` / `signup.url` | `https://sign-up.twake.app` | URL used for the sharing banner "create account" call-to-action |

## Development

### Share and send mail in development

Cozy apps let users [share documents from cozy to cozy](https://github.com/cozy/cozy-stack/blob/master/docs/sharing.md#cozy-to-cozy-sharing).

Meet Alice and Bob. Alice wants to share a folder with Bob. Alice clicks on the share button and fills in the email input with Bob's email address. Bob receives an email with a *"Accept the sharing"* button. Bob clicks on that button and is redirected to Alice's cozy to enter his own cozy url to link both cozys. Bob sees Alice's shared folder in his own cozy.

But how could we do this scenario on development environment?

#### With the docker image

If you develop with the [cozy-app-dev docker image](https://github.com/cozy/cozy-stack/blob/master/docs/client-app-dev.md#with-docker), [MailHog](https://github.com/mailhog/MailHog) is running inside it to catch emails.

If cozy-stack has to send an email, MailHog catches it and exposes it on its web interface on <http://cozy.tools:8025/>.

#### With the binary cozy-stack

If you develop with the [cozy-stack CLI](https://github.com/cozy/cozy-stack/blob/master/docs/cli/cozy-stack.md), you have to run [MailHog](https://github.com/mailhog/MailHog) on your computer and tell `cozy-stack serve` where to find the mail server with some [options](https://github.com/cozy/cozy-stack/blob/master/docs/cli/cozy-stack_serve.md#options):

```
./cozy-stack serve --appdir drive:../cozy-drive/build,settings:../cozy-settings/build --mail-disable-tls --mail-port 1025
```

*This commands assumes you `git clone` [cozy-drive](https://github.com/cozy/cozy-drive) and [cozy-settings](https://github.com/cozy/cozy-settings) in the same folder than you `git clone` [cozy-stack](https://github.com/cozy/cozy-stack).*

Then simply run `mailhog` and open <http://cozy.tools:8025/>.

#### Retrieve sent emails

With MailHog, **every email** sent by cozy-stack is caught. That means the email address *does not have to be a real one*, ie. `bob@cozy`, `bob@cozy.tools` are perfectly fine. It *could be a real one*, but the email will not reach the real recipient's inbox, say `contact@cozycloud.cc`.

***

## Architecture

The share modal's component tree is documented in [`docs/share-modal-architecture.md`](docs/share-modal-architecture.md).

Key decisions:

- `ShareModal` checks `isEditable` → `EditableSharingModal` (editable) or `SharingDetailsModal` (read-only).
- `EditableSharingModal` renders `ShareModal` (the dumb component), which decides `ShareDialogCozyToCozy` vs `ShareDialogOnlyByLink` based on flags and context.
- `ShareDialogTwoStepsConfirmationContainer` wraps the cozy-to-cozy dialog when recipients need confirmation (untrusted contacts).
- Federated mode: when `drive.federated-shared-folder.enabled` is true, `FederatedFolderModal` replaces the standard `EditableSharingModal`.
- `WhoHasAccess` accepts an independent `canManageLink` prop to control link management (gear + perm dropdown) separately from `canManageMembers` which controls member management. This allows shared-drive members to see the link gear without the member cross/perm menu.
