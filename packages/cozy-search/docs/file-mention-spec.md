# File Mention Feature - Implementation Spec

## Goal

Implement file mention functionality in the AI assistant. When the user types `@` in the chat input, a search dropdown opens showing files from the Cozy drive (doctype `io.cozy.files`). The user can select files, which appear as removable chips below the input. When the message is sent, the selected file IDs are included in the API request as `attachmentsIDs`.

## Screenshots

See the two screenshots attached to this task:

- **Screenshot 1 (search dropdown)**: The file search dropdown appears as soon as the user types `@`. As the user continues typing (e.g., `@space`), the results are filtered. The screenshot shows the dropdown with a matching file ("Space Observation with the Skywatcher 200-1000.cozy-note" with its file icon and path "/Linagora"). The dropdown is anchored to the input bar.

- **Screenshot 2 (selected file chip)**: After selecting a file, a chip appears below the input showing the filename with an X button to remove it. The `@searchterm` text has been cleared from the input, which is back to its placeholder state.

## Feature Behavior

### Trigger
- Typing `@` immediately opens the mention menu (the dropdown appears right away, even before any search term is typed). The `@` must be preceded by whitespace or be at the start of the string (to avoid triggering on email addresses like `user@example.com`)
- Characters typed after `@` filter the results (e.g., `@space` filters for "space")
- The search term should support spaces so filenames like "my report.pdf" can be found
- **Hint**: A regex like `/(^|\s)@([\w. ]*)$/` handles all these cases — the `(^|\s)` ensures `@` is at start or after whitespace, and `[\w. ]*` allows word chars, dots, and spaces in the search term. You'll need a corresponding replace regex to strip the `@term` on selection.

### Search
- The search must be restricted to `io.cozy.files` only (no contacts, emails, etc.)
- Directories should be excluded from results
- Use the existing `useFetchResult` hook from `src/components/Search/useFetchResult.jsx` which calls the DataProxy search API
- **Hint**: `useFetchResult(searchValue, searchOptions)` accepts a second parameter. Inside the hook, `searchOptions` is spread into the DataProxy `search(searchValue, searchOptions)` call after extracting `maxRetries` and `delay`. You can pass `doctypes: ['io.cozy.files']` to restrict results at the search level. For directory exclusion, you can pass `excludeFilters: { type: 'directory' }` — but verify this works; if not, filter client-side using the `type` field on results.
- **Hint**: `useFetchResult` currently does not include the `type` property (file vs directory) in its returned result objects. You may need to add `type: r.type` to the result mapping inside the hook so the menu can filter out directories if needed.
- **Important**: The result objects from `useFetchResult` have this shape: `{ id, icon, slug, url, secondaryUrl, primary, secondary, onClick }`. There is NO `doc` field and NO `_type` field. Do not try to filter results by `r.doc._type` — it will crash. Use the `doctypes` search option to filter at the API level, or add `type: r.type` to the result mapping and filter on that.
- Debounce the search input by 250ms to avoid excessive API calls
- **Empty search term**: When the user has typed just `@` with no search term yet, do NOT call `useFetchResult` (it returns a stuck loading state for empty strings). Instead, show a placeholder message in the dropdown (e.g., "Type to search files"). Only start searching once the user types at least one character after `@`.
- **Search options identity**: Define the search options (`{ doctypes: [...], excludeFilters: {...} }`) as a constant outside the component (or in a separate constants file) to avoid creating a new object reference on every render.

### Selection
- Clicking a result or pressing Enter/Tab selects it
- Arrow keys navigate the dropdown list
- Escape closes the dropdown
- On selection: the file is added to the selected files list, and the `@searchterm` text is removed from the input
- Multiple files can be selected by typing `@` again
- **Important**: The actual text displayed in the input is managed by `@assistant-ui/react`'s `composerRuntime`. To programmatically change the input text, you must use `composerRuntime.setText(newText)` and read current text via `composerRuntime.getState().text`. The `composerRuntime` is available from the `useComposerRuntime()` hook in `ConversationComposer`.

### Keyboard conflict with Enter-to-send
- **Critical**: In `ConversationComposer`, the existing `handleKeyDown` sends the message when Enter is pressed. When the mention menu is open, Enter must select the highlighted file instead of sending the message. Same for Escape (should close the menu, not be ignored) and ArrowUp/Down (should navigate the menu, not move the cursor).
- The keyboard events fire on the input element (inside `ConversationBar`). The `FileMentionMenu` component is rendered nearby but does not receive focus — the user keeps typing in the input. So keyboard handling for the menu must be intercepted at the `ConversationBar` or `ConversationComposer` level and forwarded/delegated to the menu logic. Do NOT rely on `onKeyDown` handlers on `ListItem` elements inside the menu — they will never fire because those elements don't have focus.

### How the menu closes
- The menu is rendered conditionally: `{hasMention && <FileMentionMenu ... />}`. It closes when `hasMention` becomes `false`.
- `hasMention` is derived from the context's `inputValue` matching the `@` regex. So the menu closes when the `@term` is removed from the text.
- **Both file selection AND Escape** must clear the `@term` from the input. This means both actions need to: (1) read current text from `composerRuntime.getState().text`, (2) regex-replace the `@term`, (3) call `composerRuntime.setText(newText)`, (4) call `handleInputChange(newText)` on the context. When the context's `inputValue` no longer matches the regex, `hasMention` becomes false and the menu unmounts.

### Display
- Selected files appear as chips (using `cozy-ui/transpiled/react/Chips`) below the input bar
- Each chip shows the filename and has a delete button to remove the file

### Sending
- When the message is sent, include an `attachmentsIDs` field in the POST body alongside the existing `q` and `assistantID` fields
- `attachmentsIDs` is an array of file `_id` strings
- Only include the field if the array is non-empty
- The API endpoint is: `POST /ai/chat/conversations/${conversationId}`

## Architecture

### New Files to Create

1. **`src/components/Conversations/FileMentionContext.jsx`** - React context providing state management for file selection. Must expose:
   - `selectedFiles` - array of selected file objects `{ id, name, path, icon }`
   - `addFile(file)` / `removeFile(fileId)` - add/remove files
   - `handleInputChange(text)` - tracks current input text to detect `@` mentions
   - `hasMention` / `mentionSearchTerm` - derived state from input text
   - `getAttachmentsIDs()` - returns array of selected file IDs (for the adapter to call at send time)
   - **Important: dual-state model** — This context maintains its own `inputValue` as a shadow copy of the real input text (which is owned by `@assistant-ui/react`'s `composerRuntime`). The context's `inputValue` is used **only** for mention detection (`hasMention`, `mentionSearchTerm`). It is NOT the source of truth for what's displayed in the input. Every time the input changes, `handleInputChange` must be called to keep the shadow in sync. Every time text is programmatically changed via `composerRuntime.setText()`, `handleInputChange` must also be called with the new value.

2. **`src/components/Conversations/FileMentionMenu.jsx`** - The dropdown search menu. Receives `anchorEl` (for Popper positioning), `searchTerm`, and `composerRuntime` (for text manipulation) as props. Uses cozy-ui Popper/Paper/List components.
   - The menu needs to clear the `@searchterm` from the input when a file is selected. Since the displayed text is controlled by `composerRuntime`, the menu should: read current text via `composerRuntime.getState().text`, regex-replace the `@term`, then call `composerRuntime.setText(newText)` and also update the `FileMentionContext` via `handleInputChange(newText)` to keep state in sync.

3. **`src/components/Conversations/FileChipsList.jsx`** - Renders selected files as removable chips. Consumes `useFileMention()` context.

### Files to Modify

4. **`src/components/Conversations/ConversationBar.jsx`** - Add `@` detection logic, render `FileMentionMenu` when mention is active, intercept text changes to feed the context.
   - **Note**: The existing `ConversationBar` does not have an `onChange` handler. The input is a `ComposerPrimitive.Input` (from `@assistant-ui/react`) passed as `inputComponent` to `SearchBar`. You need to add an `onChange` prop on the `SearchBar` component inside `ConversationBar`. In that handler, call `handleInputChange(e.target.value)` from the `useFileMention()` context (which is available because `FileMentionProvider` wraps the tree higher up). You do NOT need to pass `onChange` from `ConversationComposer` — `ConversationBar` accesses the context directly via the hook.

5. **`src/components/Conversations/ConversationComposer.jsx`** - Add `FileChipsList` below the `ConversationBar`. Pass `composerRuntime` to `ConversationBar` so it can be forwarded to `FileMentionMenu` for text manipulation.

6. **`src/components/adapters/CozyRealtimeChatAdapter.ts`** - Add `getAttachmentsIDs` to the adapter options interface and include `attachmentsIDs` in the POST body.

7. **`src/components/CozyAssistantRuntimeProvider.tsx`** - Wire the `FileMentionContext` so that `getAttachmentsIDs` is available to the adapter.

### Key Architectural Challenge

The `FileMentionContext` must be accessible from two places:
- **UI layer**: `ConversationBar` and `FileChipsList` need to read/write selected files
- **Adapter layer**: The `CozyRealtimeChatAdapter` needs `getAttachmentsIDs()` at send time

The adapter is created inside `CozyAssistantRuntimeProviderInner` (in `CozyAssistantRuntimeProvider.tsx`). The UI components are rendered as children further down the tree. The `FileMentionProvider` must wrap both.

The challenge is that you cannot call `useFileMention()` in the same component that renders `<FileMentionProvider>`. You need to either split the component or restructure the tree so that the provider is above the component that creates the adapter AND above the components that use it for UI.

**Recommended approach**: In `CozyAssistantRuntimeProviderInner`, wrap the content with `<FileMentionProvider>` and extract the adapter-creation + realtime logic into a new inner component (e.g., `FileMentionAwareRuntimeProvider`) that can call `useFileMention()` because it's now a child of the provider.

## Available cozy-ui Components

- `Popper` from `cozy-ui/transpiled/react/Popper`
- `Paper` from `cozy-ui/transpiled/react/Paper`
- `List` from `cozy-ui/transpiled/react/List`
- `ListItem` from `cozy-ui/transpiled/react/ListItem`
- `ListItemIcon` from `cozy-ui/transpiled/react/ListItemIcon`
- `ListItemText` from `cozy-ui/transpiled/react/ListItemText`
- `Chip` from `cozy-ui/transpiled/react/Chips` (note: the module path is `Chips` plural)
- `Icon` from `cozy-ui/transpiled/react/Icon`

## Important Implementation Notes

- **Popper anchor**: In `ConversationBar`, the `inputRef` is currently passed as `componentsProps.inputBase.inputRef` (pointing to the actual `<input>` element). For the Popper dropdown, you need a ref to a stable DOM element to anchor the dropdown. You can use the wrapping `<div>` of the `ConversationBar` or the input element itself — just make sure the Popper anchor is valid.
- **`useFetchResult` uses `useNavigate()`**: This hook internally calls `useNavigate()` from `react-router-dom`. This is fine because the assistant is rendered inside a routed view, but be aware of it if you're writing tests — you'll need a Router context in your test wrapper.
- **No `getAttachmentsIDs` stability concern**: Since `getAttachmentsIDs` is derived from `selectedFiles`, it will change reference when files are added/removed. If you pass it as a dependency to the `useMemo` that creates the adapter, the adapter will be recreated on every file selection. This is acceptable — the adapter is cheap to create. Alternatively, use `useCallback` with `selectedFiles` dependency.
- **Jest config does not match `.jsx` test files**: The current `tests/jest.config.js` has `testMatch: ['./**/*.spec.{ts,tsx,js}']` — note the absence of `jsx`. If you write test files as `.spec.jsx`, you must add `jsx` to the pattern: `./**/*.spec.{ts,tsx,js,jsx}`. Otherwise your tests will silently not run.
- **Named export for `FileMentionProvider`**: Export `FileMentionProvider` and `useFileMention` as named exports (not default) from `FileMentionContext.jsx`, since they will be imported as `{ FileMentionProvider, useFileMention }` in multiple files.

## Constraints

- Follow the existing code style (no semicolons, single quotes, arrow functions)
- The project uses `lodash/debounce` for debouncing (already a dependency)
- Do not add new dependencies
- The codebase uses `cozy-minilog` for logging
- Memoize context values and callbacks with `useMemo`/`useCallback` to prevent unnecessary re-renders
- The build system is TypeScript-aware but new components can be `.jsx`

## Deliverables

1. Implement all the files listed above (create new files, modify existing files)
2. Run `yarn build` from the `packages/cozy-search` directory and ensure it passes with no errors
3. Run `yarn test` from the `packages/cozy-search` directory and ensure existing tests still pass (no regressions)
4. Commit all changes with a single descriptive commit message

Note: Writing new unit tests for the new components is optional but appreciated. Focus on making the feature work correctly first.
