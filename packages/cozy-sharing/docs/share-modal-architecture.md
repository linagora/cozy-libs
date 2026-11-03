# ShareModal architecture

```mermaid
flowchart TD
    ShareModal --> ShareModalConditions{isReadOnly}
    ShareModalConditions --> |yes| SharingDetailsModal
    ShareModalConditions --> |no| EditableSharingModal
    SharingDetailsModal --> WhoHasAccessWrapper
    EditableSharingModal --> DumbShareModal
    DumbShareModal --> DumbShareModalConditions{isOnlyByLink}
    DumbShareModalConditions --> |yes| ShareDialogOnlyByLink
    DumbShareModalConditions --> |no| ShareDialogCozyToCozy
    ShareDialogOnlyByLink --> WhoHasAccessWrapper
    ShareDialogOnlyByLink --> DumbShareByLink
    ShareDialogCozyToCozy --> ShareDialogTwoStepsConfirmationContainer
    ShareDialogTwoStepsConfirmationContainer --> |dialogContentOnShare|SharingContent
    ShareDialogTwoStepsConfirmationContainer --> |dialogTitleOnShare|SharingTitleFunction
    ShareDialogTwoStepsConfirmationContainer --> |dialogActionsOnShare|DumbShareByLink
    SharingContent --> WhoHasAccessWrapper
    WhoHasAccessWrapper --> WhoHasAccess
    WhoHasAccess --> |cozy-ui|MemberList
    SharingContent --> ShareByEmail
    ConfirmTrustedRecipientsDialog --> DumbConfirmTrustedRecipientsDialog
    DumbConfirmTrustedRecipientsDialog --> ShareDialogTwoStepsConfirmationContainer
    ShareByEmail --> ShareAutosuggestWrapper
    ShareAutosuggestWrapper --> ShareAutosuggest
    ShareAutosuggest --> |cozy-ui|MemberAutocomplete
```

### Specific case of `ShareDialogTwoStepsConfirmationContainer`

#### Content

```mermaid
flowchart TD
    A(status === 'error') --> |yes|ErrorContent
    A --> |no| B(status === 'loading')
    B --> |yes|LoadingContent
    B --> |no| C(status === 'sharing')
    C --> |yes|DialogContentOnShare
    DialogContentOnShare --> SharingContent
    C --> |no|D(status === 'confirmingRecipient')
    D --> |yes|ConfirmationDialogContent
    D --> |no|E(status === 'rejectingRecipient')
    E --> |yes|RejectDialogContent
    E --> |no|F[null]
```
