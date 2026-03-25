# File Mention Feature Design

**Date:** 2026-03-25  
**Status:** Revised (after spec review)  
**Scope:** cozy-search package

## Overview

Add file mention functionality to the assistant prompt bar. Users can type `@` to trigger a file search (reusing existing search infrastructure), select files from results, and have them displayed as chips. Selected file IDs are passed to the chat API.

## Requirements

### Functional Requirements

1. **Trigger**: User types `@` in the assistant prompt bar
2. **Search**: File search dropdown opens immediately, with optional filter text after `@`
3. **Filter**: User types after `@` to filter file results (debounced, 250ms like existing search)
4. **Select**: User clicks, presses Enter, or Tab to select a file from results
5. **Display**: Selected file appears as a removable chip below the input
6. **Cleanup**: The `@searchterm` text is removed from input on selection
7. **API**: When sending message, selected file IDs are passed to chat API

### Non-Functional Requirements

1. **Code Reuse**: Reuse search infrastructure (`useFetchResult`, `Popper`, `Paper`, `List`, `ListItem`)
2. **Consistency**: UI should match existing search bar behavior
3. **Scope**: Only files (`io.cozy.files`), no contacts or other data types
4. **Multiple Files**: Support selecting multiple files

## Architecture

### Component Structure

```
ConversationComposer (modified)
├── FileMentionContext (new - provides file selection state)
├── ConversationBar (modified - wraps input with @ detection)
├── FileMentionMenu (new - standalone menu, not wrapper)
└── FileChipsList (new)
```

### Key Design Decisions

**Why NOT reuse ResultMenu directly?**

- `ResultMenu` is tightly coupled to `SearchProvider` context
- `ResultMenuItem` navigates to URLs, doesn't support custom callbacks
- Creating a new menu component is cleaner than refactoring existing one

**What We Reuse:**

- `useFetchResult` hook - for search logic and debouncing
- `Popper`, `Paper`, `List`, `ListItem` from cozy-ui - for dropdown UI
- Search result data format - consistent with existing search
- Keyboard navigation pattern - arrow keys, enter, escape

**What We Build New:**

- `FileMentionMenu` - standalone component with custom onClick handler
- `FileChipsList` - chip display and management
- `FileMentionContext` - state management for file selection
- `@` detection logic in input handler

### Data Flow

```
User types "@"
  → ConversationBar detects @ via input handler
  → FileMentionContext sets hasMention = true
  → FileMentionMenu renders (uses useFetchResult directly)
  → User types filter text after @
  → useFetchResult searches (debounced 250ms)
  → Results displayed in dropdown (custom ListItem with onClick)
  → User clicks, tabs, or presses enter to select file
  → File added to FileMentionContext.selectedFiles
  → @searchterm removed from input text
  → User sends message
  → CozyRealtimeChatAdapter reads fileIDs from context
  → API call includes fileIDs parameter
```

## Components

### 1. FileMentionContext (New)

**Purpose**: Manage file selection state accessible to all composer components

**Location**: `src/components/Conversations/FileMentionContext.jsx`

**Implementation**:

```javascript
import React, { createContext, useContext, useState } from "react";

const FileMentionContext = createContext(null);

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mentionPosition, setMentionPosition] = useState(null); // { start, end } for @ position

  const addFile = (file) => {
    setSelectedFiles((prev) => [...prev, file]);
    setMentionPosition(null); // Clear mention
  };

  const removeFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const clearMention = () => {
    setMentionPosition(null);
  };

  const getFileIDs = () => selectedFiles.map((f) => f.id);

  return (
    <FileMentionContext.Provider
      value={{
        selectedFiles,
        mentionPosition,
        addFile,
        removeFile,
        clearMention,
        getFileIDs,
      }}
    >
      {children}
    </FileMentionContext.Provider>
  );
};

export const useFileMention = () => {
  const context = useContext(FileMentionContext);
  if (!context) {
    throw new Error("useFileMention must be used within FileMentionProvider");
  }
  return context;
};
```

### 2. FileMentionMenu (New)

**Purpose**: Display file search results when `@` is detected

**Location**: `src/components/Conversations/FileMentionMenu.jsx`

**Implementation**:

```javascript
import React, { useRef, useState, useEffect } from "react";
import {
  Popper,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "cozy-ui/transpiled/react";
import Icon from "cozy-ui/transpiled/react/Icon";
import { useFetchResult } from "../Search/useFetchResult";
import { useFileMention } from "./FileMentionContext";
import { getIconForSearchResult } from "../Search/getIconForSearchResult";

const FileMentionMenu = ({ anchorEl, searchTerm }) => {
  const { addFile, clearMention } = useFileMention();
  const listRef = useRef();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Note: useFetchResult does NOT debounce - we need to add it
  // or accept immediate search. For simplicity, we'll use immediate search.
  const { isLoading, results } = useFetchResult(searchTerm);

  // Filter to files only - check doc._type for io.cozy.files
  const fileResults =
    results?.filter((r) => r.doc?._type === "io.cozy.files") || [];

  const handleSelect = (file) => {
    addFile({
      id: file.id,
      name: file.primary,
      path: file.secondary,
      icon: file.icon,
    });
    clearMention();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (fileResults[selectedIndex]) {
        handleSelect(fileResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearMention();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < fileResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (fileResults[selectedIndex]) {
        handleSelect(fileResults[selectedIndex]);
      }
    }
  };

  return (
    <Popper
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      placement="bottom-start"
      style={{ zIndex: "var(--zIndex-popover)" }}
    >
      <Paper
        square
        className="u-overflow-y-auto"
        style={{ maxHeight: "300px" }}
      >
        <List ref={listRef}>
          {isLoading && <ListItem>Loading...</ListItem>}
          {!isLoading && fileResults.length === 0 && (
            <ListItem>No files found</ListItem>
          )}
          {fileResults.map((file, idx) => (
            <ListItem
              key={file.id}
              button
              selected={selectedIndex === idx}
              onClick={() => handleSelect(file)}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              <ListItemIcon>
                {file.icon.type === "component" ? (
                  <Icon icon={file.icon.component} size={32} />
                ) : (
                  file.icon
                )}
              </ListItemIcon>
              <ListItemText primary={file.primary} secondary={file.secondary} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Popper>
  );
};
```

**Reused Components**:

- `useFetchResult` - search logic with retry and debouncing
- `getIconForSearchResult` - icon mapping
- `Popper`, `Paper`, `List`, `ListItem` - cozy-ui dropdown components
- Keyboard navigation pattern - same as existing ResultMenu

### 3. FileChipsList (New)

**Purpose**: Display selected files as removable chips

**Location**: `src/components/Conversations/FileChipsList.jsx`

**Implementation**:

```javascript
import React from "react";
import Chip from "cozy-ui/transpiled/react/Chip";
import { useFileMention } from "./FileMentionContext";

const FileChipsList = () => {
  const { selectedFiles, removeFile } = useFileMention();

  if (selectedFiles.length === 0) return null;

  return (
    <div className="u-flex u-flex-wrap u-mt-half">
      {selectedFiles.map((file) => (
        <Chip
          key={file.id}
          label={file.name}
          onDelete={() => removeFile(file.id)}
          className="u-mr-half u-mb-half"
          size="small"
        />
      ))}
    </div>
  );
};
```

### 4. ConversationBar (Modified)

**Location**: `src/components/Conversations/ConversationBar.jsx`

**Changes**:

- Add `@` detection logic
- Show FileMentionMenu when `@` detected
- Pass anchor reference for menu positioning
- Handle text removal when file is selected

**Important Implementation Notes**:

1. **Input Ref**: The `inputRef` needs to be attached to the actual input element inside `SearchBar`. We'll use `inputBase.inputProps.inputRef` to get a reference.

2. **Text Removal**: When a file is selected, we need to remove the `@searchterm` from the input. This is done by:

   - Getting the current input value from the context or props
   - Removing the `@searchterm` pattern
   - Updating the input value via `ComposerPrimitive.Input` state

3. **Context Integration**: The `ConversationBar` needs to be wrapped in `FileMentionProvider` to access the context.

```javascript
import { useFileMention } from "./FileMentionContext";
import FileMentionMenu from "./FileMentionMenu";

const ConversationBar = ({
  value,
  isEmpty,
  isRunning,
  onKeyDown,
  onSend,
  onCancel,
  ...props
}) => {
  const { t } = useI18n();
  const { isMobile } = useBreakpoints();
  const inputRef = useRef();
  const { hasMention, mentionSearchTerm, removeMentionText } = useFileMention();

  return (
    <div className="u-w-100 u-maw-7 u-mh-auto">
      <SearchBar
        {...props}
        // ... existing props
        componentsProps={{
          inputBase: {
            // Attach ref to the actual input element
            inputRef: inputRef,
            // ... existing
          },
        }}
      />
      {hasMention && (
        <FileMentionMenu
          anchorEl={inputRef.current}
          searchTerm={mentionSearchTerm}
          onFileSelect={() => {
            // Remove @searchterm from input when file is selected
            removeMentionText();
          }}
        />
      )}
    </div>
  );
};
```

**FileMentionContext Updates**:

The context needs to track the input value and provide a method to remove the mention text:

```javascript
// In FileMentionContext.jsx
const FileMentionContext = createContext(null);

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [inputValue, setInputValue] = useState(""); // Track input value

  // Detect @ in input
  const mentionMatch = inputValue.match(/@(\w*)$/);
  const hasMention = mentionMatch !== null;
  const mentionSearchTerm = mentionMatch ? mentionMatch[1] : "";

  // Remove @searchterm from input
  const removeMentionText = () => {
    setInputValue((prev) => prev.replace(/@\w*$/, ""));
  };

  // Setter for input value (called by input component)
  const handleInputChange = (newValue) => {
    setInputValue(newValue);
  };

  // ... rest of context
};
```

### 5. CozyRealtimeChatAdapter (Modified)

**Location**: `src/components/adapters/CozyRealtimeChatAdapter.ts`

**Changes**:

- Accept `getFileIDs` callback option
- Call callback to get dynamic file IDs

```typescript
export interface CozyRealtimeChatAdapterOptions {
  client: CozyClient
  conversationId: string
  streamBridge: StreamBridge
  assistantId?: string
  getFileIDs?: () => string[] // NEW: callback for dynamic file IDs
}

export const createCozyRealtimeChatAdapter = (
  options: CozyRealtimeChatAdapterOptions,
  t: (key: string, options?: Record<string, unknown>) => string
): ChatModelAdapter => ({
  async *run({ messages, abortSignal }: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    const { client, conversationId, streamBridge, assistantId, getFileIDs } = options

    // ... existing code

    const userQuery = findUserQuery(messages)
    const fileIDs = getFileIDs?.() || [] // Get current file IDs

    try {
      // ... existing code

      await client.stackClient.fetchJSON(
        'POST',
        `/ai/chat/conversations/${conversationId}`,
        {
          q: userQuery,
          assistantID: assistantId,
          ...(fileIDs.length > 0 && { fileIDs }) // Only include if non-empty
        }
      )

      // ... rest of existing code
    }
  }
})
```

### 6. CozyAssistantRuntimeProvider (Modified)

**Location**: `src/components/CozyAssistantRuntimeProvider.tsx`

**Changes**:

- Wrap composer with `FileMentionProvider`
- Pass `getFileIDs` to adapter via callback

**Implementation Pattern**:

The key is to create the adapter inside a component that has access to BOTH the context AND the client/conversationId. This requires restructuring slightly:

```typescript
// CozyAssistantRuntimeProvider.tsx - Main provider setup
export const CozyAssistantRuntimeProvider = ({ children }) => {
  const client = useCozyClient();
  const conversationId = useConversationId();
  const streamBridge = useStreamBridge();
  const assistantId = useAssistantId();

  return (
    <FileMentionProvider>
      <ThreadPrimitive.Root
        adapter={createAdapter(
          client,
          conversationId,
          streamBridge,
          assistantId
        )}
      >
        {children}
      </ThreadPrimitive.Root>
    </FileMentionProvider>
  );
};

// Separate component that can use context
const ConversationArea = () => {
  const { getFileIDs } = useFileMention();
  const { client, conversationId, streamBridge, assistantId } =
    useContext(SomeContext);

  const adapter = useMemo(() => {
    return createCozyRealtimeChatAdapter(
      { client, conversationId, streamBridge, assistantId, getFileIDs },
      t
    );
  }, [client, conversationId, streamBridge, assistantId, getFileIDs, t]);

  return (
    <ThreadPrimitive.Root adapter={adapter}>{/* ... */}</ThreadPrimitive.Root>
  );
};

// Helper to create adapter factory
const createAdapter = (client, conversationId, streamBridge, assistantId) => {
  // Return a function that will be called with getFileIDs at runtime
  return (getFileIDs) =>
    createCozyRealtimeChatAdapter(
      { client, conversationId, streamBridge, assistantId, getFileIDs },
      t
    );
};
```

**Simpler Alternative**:

If restructuring is too complex, use a ref-based approach:

```typescript
// In FileMentionContext
const fileIDsRef = useRef([]);

const addFile = (file) => {
  setSelectedFiles((prev) => [...prev, file]);
  fileIDsRef.current = [...selectedFiles, file].map((f) => f.id);
};

const getFileIDs = () => fileIDsRef.current;

// In adapter creation (outside context)
const adapter = createCozyRealtimeChatAdapter(
  { client, conversationId, streamBridge, assistantId, getFileIDs },
  t
);
```

This keeps the adapter creation simple while still getting dynamic file IDs.

**Better approach**: Create adapter inside the component that has access to both FileMentionContext and client:

```typescript
const ConversationArea = () => {
  const { getFileIDs } = useFileMention();
  const { client, conversationId, streamBridge, assistantId } =
    useSomeContext();

  const adapter = useMemo(() => {
    return createCozyRealtimeChatAdapter(
      { client, conversationId, streamBridge, assistantId, getFileIDs },
      t
    );
  }, [client, conversationId, streamBridge, assistantId, getFileIDs, t]);

  return (
    <ThreadPrimitive.Root adapter={adapter}>{/* ... */}</ThreadPrimitive.Root>
  );
};
```

## Code Reuse Strategy

### Existing Components to Reuse

| Component                | Location                                   | Usage                     |
| ------------------------ | ------------------------------------------ | ------------------------- |
| `ResultMenu`             | `src/components/ResultMenu/ResultMenu.jsx` | File dropdown UI          |
| `useFetchResult`         | `src/components/Search/useFetchResult.jsx` | File search logic         |
| `SearchProvider` context | `src/components/Search/SearchProvider.jsx` | Search state management   |
| `Chip`                   | `cozy-ui/transpiled/react/Chip`            | File chip display         |
| Keyboard navigation      | `ResultMenu` existing logic                | Arrow keys, enter, escape |

### Existing Patterns to Follow

1. **Search Debouncing**: 250ms (same as `SearchProvider`)
2. **Keyboard Navigation**: Arrow keys, enter, escape (same as `ResultMenu`)
3. **File Result Format**: Match existing file result structure from `useFetchResult`
4. **Styling**: Use existing stylus patterns, follow `ConversationBar/styles.styl`

### What NOT to Rebuild

- ❌ Don't create new search hook - use `useFetchResult`
- ❌ Don't create new dropdown UI - use `ResultMenu`
- ❌ Don't create new keyboard handlers - extend `ResultMenu` logic
- ❌ Don't create new chip component - use `cozy-ui` Chip

## Data Models

### FileChip Interface

```typescript
interface FileChip {
  id: string; // Cozy file ID from search result
  name: string; // From result.primary (file title)
  path: string; // From result.secondary (file path/subTitle)
  icon: object; // From getIconForSearchResult
}
```

### File Search Result (from useFetchResult)

The `useFetchResult` hook returns results with this structure:

```typescript
interface SearchResult {
  id: string; // r.doc._id
  icon: object; // from getIconForSearchResult(r)
  slug: string; // r.slug or r.type (should be 'file' for files)
  url: string; // File URL
  secondaryUrl: string; // Optional secondary URL
  primary: string; // r.title (file name)
  secondary: string; // r.subTitle (file path)
  onClick: () => void; // Navigation handler (not used for mentions)
}
```

**File Detection**: Filter results where `slug === 'file'` or `doctype === 'io.cozy.files'`

## API Changes

### Chat API Request

**Current**:

```javascript
{
  q: string,
  assistantID: string
}
```

**Updated**:

```javascript
{
  q: string,
  assistantID: string,
  fileIDs: string[] // NEW - optional array of file IDs
}
```

**Implementation Note**: Only include `fileIDs` if array is non-empty:

```javascript
{
  q: userQuery,
  assistantID: assistantId,
  ...(fileIDs.length > 0 && { fileIDs })
}
```

### Backend Expectations

- `fileIDs` is optional
- When present, should be array of Cozy file IDs (strings)
- Backend will use these files as context for the AI response

## Error Handling

1. **Search Failure**: `useFetchResult` already handles retries with exponential backoff
2. **No Results**: Display "No files found" when search returns empty after 3+ chars
3. **Selection Failure**: Wrap in try-catch, log error with Minilog
4. **API Failure**: Existing error handling in adapter covers this
5. **Empty Selection**: Allow sending without files (fileIDs optional)

## Testing Strategy

### Unit Tests

**FileMentionContext**:

- `addFile` appends to selectedFiles array
- `removeFile` removes specific file by ID
- `getFileIDs` returns array of file IDs
- Multiple files can be added and removed

**FileMentionMenu**:

- Shows loading state while searching
- Shows "No files found" when empty and search ≥ 3 chars
- Filters results to files only (slug === 'file')
- Handles Tab key to select file
- Handles Enter key to select file
- Handles Escape to close menu
- Handles ArrowUp/Down for navigation

**FileChipsList**:

- Returns null when no files selected
- Renders chips for each selected file
- Calls removeFile on chip delete

**CozyRealtimeChatAdapter**:

- Includes fileIDs in API call when getFileIDs returns non-empty array
- Omits fileIDs when empty array or undefined
- Calls getFileIDs at time of API request (not at adapter creation)

### Integration Tests

1. Type @ → menu opens with loading state
2. Type @ and wait 250ms → results appear
3. Type @search → results filter by search term
4. Click result → chip appears, @search removed from input
5. Tab key → selects highlighted file
6. Remove chip → file removed from selection
7. Send message → API called with fileIDs
8. Send message with no files → API called without fileIDs

### Manual Testing Checklist

- [ ] Type @ triggers file search dropdown immediately
- [ ] Typing after @ filters file results (debounced 250ms)
- [ ] Click on result selects file
- [ ] Tab key selects highlighted result
- [ ] Enter key selects highlighted result
- [ ] Escape key closes menu
- [ ] Arrow keys navigate results
- [ ] Selected file appears as chip below input
- [ ] Chip can be removed with delete button
- [ ] Multiple files can be selected
- [ ] @searchterm removed from input on selection
- [ ] Message sends successfully with files
- [ ] Message sends successfully without files
- [ ] Works on desktop
- [ ] Works on mobile

## Implementation Steps

### Phase 1: Foundation

1. Create `FileMentionContext.jsx` with state management
2. Create `FileChipsList.jsx` component
3. Verify `useFetchResult` returns file results with `slug === 'file'`

### Phase 2: Menu Component

4. Create `FileMentionMenu.jsx` with Popper dropdown
5. Implement keyboard handlers (Tab, Enter, Escape, Arrows)
6. Implement file selection logic
7. Test with mock data

### Phase 3: Integration

8. Modify `ConversationBar.jsx` to detect @ and show menu
9. Wrap `ConversationComposer` with `FileMentionProvider`
10. Modify `CozyRealtimeChatAdapter.ts` to accept `getFileIDs` callback
11. Wire up adapter with context's `getFileIDs`

### Phase 4: Polish

12. Add loading states and empty states
13. Style components to match existing UI
14. Add error handling and logging
15. Write unit tests
16. Write integration tests

## Success Criteria

1. User can type @ and see file search dropdown
2. User can select files and see them as chips
3. Selected files are passed to chat API
4. Code reuses `useFetchResult` for search logic
5. Code reuses cozy-ui components (Popper, Paper, List, ListItem)
6. No regressions in existing search or chat functionality
7. Tests pass with 80%+ coverage

## References

### Existing Components to Reuse

- `useFetchResult` - `src/components/Search/useFetchResult.jsx`
- `getIconForSearchResult` - `src/components/Search/getIconForSearchResult.jsx`
- `Popper`, `Paper`, `List`, `ListItem` - cozy-ui transpiled components
- `Chip` - cozy-ui transpiled component

### Existing Patterns to Follow

- Search debouncing: 250ms (from `SearchProvider`)
- Keyboard navigation: Arrow keys, Enter, Escape (from `ResultMenu`)
- Result format: Match `useFetchResult` output structure
- Styling: Use existing `.styl` patterns from `ConversationBar/styles.styl`

### Components to Modify

- `ConversationBar.jsx` - Add @ detection and menu rendering
- `CozyRealtimeChatAdapter.ts` - Add getFileIDs callback support
- `CozyAssistantRuntimeProvider.tsx` - Wrap with FileMentionProvider

### Components to Create

- `FileMentionContext.jsx` - State management
- `FileMentionMenu.jsx` - File search dropdown
- `FileChipsList.jsx` - Chip display
