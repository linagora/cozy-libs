# Cozy-search

### Prerequisite for both components

1. Install `cozy-dataproxy-lib` and update `cozy-scripts` version of your app to 8.4.0.

2. Add the provider in your tree because the SearchEngine is provided by the DataProxyProvider :

```jsx
import { DataProxyProvider } from 'cozy-dataproxy-lib'

<DataProxyProvider>
  { children }
</DataProxyProvider>
```

3. Import the CSS :

```jsx
import 'cozy-search/dist/stylesheet.css'
```

### Prerequisite for AI components

1. Add following permissions in manifest.webapp :

```json
"chatConversations": {
  "description": "Required by the cozy Assistant",
  "type": "io.cozy.ai.chat.conversations",
  "verbs": ["GET", "POST"]
},
"chatEvents": {
  "description": "Required by the cozy Assistant",
  "type": "io.cozy.ai.chat.events",
  "verbs": ["GET"]
},
"chatAssistants": {
  "description": "Required by the cozy Assistant",
  "type": "io.cozy.ai.chat.assistants",
  "verbs": ["GET", "POST", "PUT", "DELETE"]
},
"accounts": {
  "description": "Required by the cozy Assistant (provider accounts)",
  "type": "io.cozy.accounts",
  "verbs": ["GET", "POST", "PUT", "DELETE"]
}
```

The assistants and their provider accounts are created, edited and
deleted from the library's dialogs, so the host app declares the full set
of verbs (cozy-home and cozy-drive use `ALL`).

2. Add realtime queries for chat conversations in your tree :

```jsx
<RealTimeQueries doctype="io.cozy.ai.chat.conversations" />
```

### RAG indexing setup

The stack's `rag-index` worker indexes the files of the assistants'
knowledge base folders. For that an instance needs two things: its two
`rag-index` triggers (one on `io.cozy.files`, one on
`io.cozy.ai.chat.assistants`), and assistants that carry a knowledge base
folder. cozy-search sets both up when the `cozy.assistant.autoprovision`
flag lists assistants. Without the flag, it does nothing.

#### The flag

A list of assistants to create, one entry each:

```json
[{ "name": "Mes documents", "dirName": "Documents", "default": true }]
```

- `name`: the name of the assistant. Its id is derived from it.
- `dirId` or `dirName`: its knowledge base folder. `dirId` wins; it can be
  the root folder or a magic folder (`io.cozy.apps/<slug>`). `dirName` is
  a folder at the root of the Drive, created when it does not exist.
- `prompt`, `icon`: optional.
- `default`: new conversations start on this assistant once it exists
  (the first entry flagged so wins). Existing conversations keep their
  own assistant.

#### Normal behaviour

A host app calls `ensureAssistantsSetup(client)` at startup (or its
`useAssistantsSetup` hook):

1. It fetches the `rag-index` triggers. When both exist, an earlier
   session went through the setup and it stops there: one request.
2. Otherwise it runs the whole setup, `autoprovisionAssistants(client)`:
   each entry of the flag gets its `io.cozy.accounts` document, its
   assistant and its knowledge base folder, then the two triggers are
   created and the files one is launched, which starts the indexing of
   the folders. The triggers come last so that their presence means the
   setup completed.

cozy-search also runs `autoprovisionAssistants(client)` itself when the
assistant is opened. On an instance already set up it only lists the
assistants; it is there to catch a flag changed since the setup, and to
give its folder back to a provisioned assistant that lost it.

Both run once per session and share their work, so nothing runs twice.
They never throw: on a stack whose `rag-index` worker is still reserved,
the 403 on the triggers is logged and the app keeps working.

#### Migration of the existing assistants

Assistants created before a knowledge base folder became mandatory have
none, and the worker indexes nothing for them. The setup gives them the
root folder, that is the whole Drive. This is a one-off data migration,
unrelated to the entries of the flag: once every assistant has a folder,
it finds nothing to do.

An app that manages its assistants itself, without the flag, can call
`setupRagIndexing(client)`: the triggers and this migration, no
provisioning.

#### Permissions

`io.cozy.triggers` and `io.cozy.jobs` (to create and launch the
triggers), `io.cozy.ai.chat.assistants` and `io.cozy.files` (to read,
migrate and provision the assistants and their folders), and
`io.cozy.accounts` (one document per provisioned assistant).

### On desktop

You can add the search bar like this :

```jsx
import React from 'react'

import { BarSearch } from 'cozy-bar'
import { AssistantDesktop } from 'cozy-search'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const AppBarSearch = () => {
  const { isMobile } = useBreakpoints()

  return (
    <BarSearch>
      {!isMobile && (
        <AssistantDesktop
          componentsProps={{ SearchBarDesktop: { size: 'small' } }}
        />
      )}
    </BarSearch>
  )
}

export default AppBarSearch
```

### On mobile

The search and assistant are dialogs. So you just need to create a route for each dialog, and open them when you want. The SearchDialog can open the AssistantDialog and expect a route like this `assistant/:conversationId`.

```jsx
<Route path="search" element={<SearchDialog />} />
<Route
  path="assistant/:conversationId"
  element={
    <>
      <RealTimeQueries doctype="io.cozy.ai.chat.conversations" />
      <AssistantDialog />
    </>
  }
/>
```

### Opening AI conversation from a button

You can also use the `AssistantLink` component to get an onClick method that opens the AI conversation from a button.

```jsx
import { AssistantLink } from 'cozy-search'

<AssistantLink>
  {({ openAssistant }) => (
    <a onClick={openAssistant}>Open assistant</a>
  )}
</AssistantLink>
```
