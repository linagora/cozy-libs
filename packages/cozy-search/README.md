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
}
```

2. Add realtime queries for chat conversations in your tree :

```jsx
<RealTimeQueries doctype="io.cozy.ai.chat.conversations" />
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

## Architecture: reusing the AI assistant UI outside Twake

The assistant UI is split so it can be reused by an app that has **no Cozy
backend** (typically openRAG), which then plugs in its own data layer.

### Two entry points

| Entry | Contains | Cozy backend |
|---|---|---|
| `cozy-search` | everything, including the Cozy implementations | yes |
| `cozy-search/ai-chat-ui` | the view layer only | **no** |

The rule for `ai-chat-ui` is: **no cozy dependency other than `cozy-ui`**.
`cozy-ui` is pure presentation and talks to no server, so it stays. Anything
that reaches the stack — `cozy-client`, `cozy-flags`, `cozy-realtime`,
`cozy-stack-client`, `cozy-device-helper`, `cozy-dataproxy-lib` — must not be
reachable from it.

This is enforced by `src/contexts/viewLayerPurity.spec.ts`, which walks the
**transitive** import graph from `ai-chat-ui.ts` and fails on any forbidden
package. A shallow "does this file import cozy-*" check would not be enough: a
pure-looking view can render a child that imports `cozy-client`.

> Because the guard is reachability-based, a component that is not exported
> from `ai-chat-ui.ts` is not checked. Exporting a component therefore also
> means committing to keeping it pure.

### The seams

Backend-specific behaviour is injected through two React contexts.

`ConversationStore` is **required data** — reading, creating, renaming and
deleting conversations. It throws when its provider is missing, because there
is no sensible default for "where do the conversations live".

`ChatUIState` holds the ephemeral UI state the views share (currently whether
the conversation search panel is open). It throws without a provider too: a
missing one is a wiring mistake, not a configuration choice. The Cozy app's
`AssistantProvider` mounts it, so no Twake view has to remember to.

`ChatComponents` is a set of **optional** injection points, each defaulting to
a no-op so the views render without a provider:

| Slot | Role |
|---|---|
| `SourcesRenderer` | renders the sources of an assistant message |
| `ComposerExtras` | extra controls under the composer (source chips, assistant picker…) |
| `ConversationActions` | per-conversation actions in the sidebar |
| `AssistantIcon` | the mark standing for the assistant itself (branding) |
| `useSearchConversationEnabled` | whether conversation search is available |

### Where backend knowledge lives

Presentational components never derive backend-specific values themselves —
they receive them ready-made. Concretely, a component that links to a document
takes a `url` prop rather than building it, and the adapter filling the seam
computes it.

That is why `StoredSource` carries `url`, and why link building for Cozy is
centralised in `src/components/cozyWebLinks.js`: only that module knows which
Twake app serves which doctype, and under which hash.

The pairs follow a consistent naming convention — the presentational component,
and its Cozy adapter:

```
Sources.jsx              ← presentational   CozySourcesWithFilesQuery.jsx  ← Cozy adapter
KnowledgeBaseChip.jsx    ← presentational   CozyKnowledgeBaseChip.jsx      ← Cozy adapter
```

Same idea at file level: `helpers.js` is cozy-free, `cozyHelpers.js` holds what
needs `cozy-flags`.

### Where Twake specifics live

The same separation applies to product identity, not just to the backend:
branding and product configuration stay out of the reusable layer.

- The assistant's icon is the `AssistantIcon` seam. The reusable layer ships
  none; the Twake views inject `TwakeAssistantIcon`.
- `AssistantProvider` takes the initially selected assistant as a
  `defaultAssistantId` prop, so `constants.js` (which holds Twake's sentinel
  assistant and model names) is not reachable from `ai-chat-ui`.

The shipped `locales` are a superset: they contain Twake-branded copy used by
the Twake-only components, but every string the reusable views render is
brand-neutral. A host app can feed the bundle as-is and override what it wants.

### Using it from a standalone app

Mount the providers, supply a store for your own backend, and fill only the
slots you need:

```jsx
import {
  AssistantProvider,
  ChatComponentsProvider,
  ConversationStoreProvider,
  Conversation,
  Sidebar,
  Sources,
  locales
} from 'cozy-search/ai-chat-ui'

const MySourcesRenderer = ({ messageId, sources }) => (
  // `Sources` only renders: resolve links in your own adapter and pass them in
  <Sources
    messageId={messageId}
    files={sources.map(s => ({ ...s, url: myUrlFor(s), icon: myIconFor(s) }))}
  />
)

<AssistantProvider>
  <ChatComponentsProvider components={{ SourcesRenderer: MySourcesRenderer }}>
    <ConversationStoreProvider store={myStore}>
      <Sidebar />
      <Conversation />
    </ConversationStoreProvider>
  </ChatComponentsProvider>
</AssistantProvider>
```

`Sidebar` also needs a router context (it uses `useConversation`), and the
`locales` export lets you feed the strings into your own i18n setup.

The Cozy app itself is just the first consumer of these seams: see
`AssistantView` / `AssistantDialog`, which inject the `Cozy*` implementations.
