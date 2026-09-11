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
  "verbs": ["GET"]
}
```

2. Add realtime queries for chat conversations in your tree :

```jsx
<RealTimeQueries doctype="io.cozy.ai.chat.conversations" />
```

### RAG indexing setup

Call `setupRagIndexing(client)` once per session at startup (before
`ensureProvisionedAssistants` if your app provisions assistants from the
`rag.assistants.autoprovision` flag). It makes sure the instance's two
`rag-index` triggers exist (one on `io.cozy.files`, one on
`io.cozy.ai.chat.assistants`) and gives the root folder to any assistant
that has no knowledge base folder yet — the stack's `rag-index` worker
reads the assistants to know what to index, cozy-search only has to keep
the triggers and the assistants' `knowledgeBase` in shape.

It needs the following permissions: `io.cozy.triggers` and `io.cozy.jobs`
(to create and launch the triggers), `io.cozy.ai.chat.assistants` and
`io.cozy.files` (to read and migrate the assistants). It is idempotent and
never throws: on a stack whose `rag-index` worker is still reserved, the
403 is logged and the app keeps working.

An entry of `rag.assistants.autoprovision` can carry `"default": true`
(the first flagged entry wins if there are several). Every NEW
conversation then starts on that assistant once its document exists —
from the session after it was provisioned onward. Existing conversations
are unaffected: they keep their own assistant, or stay unscoped if they
had none.

```json
{ "name": "Mes documents", "dirName": "Documents", "default": true }
```

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
