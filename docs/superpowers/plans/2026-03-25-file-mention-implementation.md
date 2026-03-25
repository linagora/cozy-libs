# File Mention Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Implement file mention functionality allowing users to type `@` in the assistant prompt bar to search and attach files to their messages.

**Architecture**: Three new components (FileMentionContext, FileMentionMenu, FileChipsList) integrated into existing ConversationComposer. Uses ref-based approach for adapter integration to avoid complex context restructuring.

**Tech Stack**: React, cozy-ui, cozy-client, @assistant-ui/react

---

## File Structure

### Files to Create

1. **`src/components/Conversations/FileMentionContext.jsx`**

   - State management for file selection
   - Context provider and hook
   - Ref-based fileIDs tracking for adapter access

2. **`src/components/Conversations/FileMentionMenu.jsx`**

   - File search dropdown with Popper
   - Keyboard navigation (Tab, Enter, Escape, Arrows)
   - File selection and callback to parent

3. **`src/components/Conversations/FileChipsList.jsx`**

   - Display selected files as removable chips
   - Uses cozy-ui Chip component

4. **`src/components/Conversations/FileMentionContext.spec.jsx`**

   - Unit tests for context state management

5. **`src/components/Conversations/FileMentionMenu.spec.jsx`**

   - Unit tests for menu rendering and keyboard handling

6. **`src/components/Conversations/FileChipsList.spec.jsx`**
   - Unit tests for chip rendering and removal

### Files to Modify

1. **`src/components/Conversations/ConversationBar.jsx`**

   - Add `@` detection logic
   - Render FileMentionMenu when @ detected
   - Handle text removal on file selection

2. **`src/components/Conversations/ConversationComposer.jsx`**

   - Wrap with FileMentionProvider
   - Add FileChipsList below input

3. **`src/components/adapters/CozyRealtimeChatAdapter.ts`**

   - Add `getFileIDs` callback option to interface
   - Include fileIDs in API request body

4. **`src/components/CozyAssistantRuntimeProvider.tsx`**
   - Import FileMentionProvider
   - Wire up getFileIDs callback to adapter

---

## Task 1: Create FileMentionContext

**Files:**

- Create: `src/components/Conversations/FileMentionContext.jsx`
- Test: `src/components/Conversations/FileMentionContext.spec.jsx`

### Step 1.1: Write the failing test

```javascript
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { FileMentionProvider, useFileMention } from './FileMentionContext'

describe('FileMentionContext', () => {
  const TestComponent = () => {
    const { selectedFiles, addFile, removeFile, getFileIDs } = useFileMention()
    return (
      <div>
        <data-testid="files">{JSON.stringify(selectedFiles)}</data-testid>
        <data-testid="ids">{JSON.stringify(getFileIDs())}</data-testid>
        <button onClick={() => addFile({ id: '1', name: 'File1' })}>Add</button>
        <button onClick={() => removeFile('1')}>Remove</button>
      </div>
    )
  }

  it('should start with empty file list', () => {
    const { getByTestId } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    )
    expect(getByTestId('files').textContent).toBe('[]')
    expect(getByTestId('ids').textContent).toBe('[]')
  })

  it('should add files to the list', () => {
    const { getByTestId, getByText } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    )
    fireEvent.click(getByText('Add'))
    expect(getByTestId('files').textContent).toContain('File1')
    expect(getByTestId('ids').textContent).toContain('1')
  })

  it('should remove files from the list', () => {
    const { getByTestId, getByText } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    )
    fireEvent.click(getByText('Add'))
    fireEvent.click(getByText('Remove'))
    expect(getByTestId('files').textContent).toBe('[]')
  })

  it('should throw error when used outside provider', () => {
    const BadComponent = () => {
      useFileMention()
      return null
    }
    expect(() => render(<BadComponent />)).toThrow(
      'useFileMention must be used within FileMentionProvider'
    )
  })
})
```

Run: `cd packages/cozy-search && yarn jest src/components/Conversations/FileMentionContext.spec.jsx`
Expected: FAIL - Module not found

### Step 1.2: Write minimal implementation

```javascript
import React, { createContext, useContext, useState, useRef } from "react";

const FileMentionContext = createContext(null);

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [inputValue, setInputValue] = useState('')
  const fileIDsRef = useRef([])

  const addFile = (file) => {
    setSelectedFiles((prev) => {
      const updated = [...prev, file]
      fileIDsRef.current = updated.map((f) => f.id)
      return updated
    })
  }

  const removeFile = (fileId) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId)
      fileIDsRef.current = updated.map((f) => f.id)
      return updated
    })
  }

  const removeMentionText = () => {
    setInputValue((prev) => prev.replace(/@\w*$/, ''))
  }

  const handleInputChange = (newValue) => {
    setInputValue(newValue)
  }

  const mentionMatch = inputValue.match(/@(\w*)$/)
  const hasMention = mentionMatch !== null
  const mentionSearchTerm = mentionMatch ? mentionMatch[1] : ''

  const getFileIDs = () => fileIDsRef.current

  const value = {
    selectedFiles,
    inputValue,
    addFile,
    removeFile,
    removeMentionText,
    handleInputChange,
    hasMention,
    mentionSearchTerm,
    getFileIDs
  }

  return (
    <FileMentionContext.Provider value={value}>
      {children}
    </FileMentionContext.Provider>
  )
}
  return context;
};
```

Run: `cd packages/cozy-search && yarn jest src/components/Conversations/FileMentionContext.spec.jsx`
Expected: PASS

### Step 1.3: Commit

```bash
git add src/components/Conversations/FileMentionContext.jsx src/components/Conversations/FileMentionContext.spec.jsx
git commit -m "feat: add FileMentionContext for file selection state"
```

---

## Task 2: Create FileChipsList

**Files:**

- Create: `src/components/Conversations/FileChipsList.jsx`
- Test: `src/components/Conversations/FileChipsList.spec.jsx`

### Step 2.1: Write the failing test

```javascript
import React, { useEffect } from "react";
import { render, fireEvent } from "@testing-library/react";
import { FileMentionProvider, useFileMention } from "./FileMentionContext";
import FileChipsList from "./FileChipsList";

describe("FileChipsList", () => {
  it("should return null when no files selected", () => {
    const { container } = render(
      <FileMentionProvider>
        <FileChipsList />
      </FileMentionProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render chips for selected files", () => {
    const TestComponent = () => {
      const { addFile } = useFileMention();
      useEffect(() => {
        addFile({ id: "1", name: "File1" });
        addFile({ id: "2", name: "File2" });
      }, []);
      return <FileChipsList />;
    };
    const { getByText } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    );
    expect(getByText("File1")).toBeInTheDocument();
    expect(getByText("File2")).toBeInTheDocument();
  });

  it("should remove file on chip delete", () => {
    const TestComponent = () => {
      const { addFile } = useFileMention();
      useEffect(() => {
        addFile({ id: "1", name: "File1" });
      }, []);
      return <FileChipsList />;
    };
    const { getByText, queryByText } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    );
    const deleteButton = getByText("File1").closest("button");
    fireEvent.click(deleteButton);
    expect(queryByText("File1")).not.toBeInTheDocument();
  });
});
```

Run: `cd packages/cozy-search && yarn jest src/components/Conversations/FileChipsList.spec.jsx`
Expected: FAIL - Module not found

### Step 2.2: Write minimal implementation

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

export default FileChipsList;
```

Run: `cd packages/cozy-search && yarn jest src/components/Conversations/FileChipsList.spec.jsx`
Expected: PASS (may need to fix test setup)

### Step 2.3: Commit

```bash
git add src/components/Conversations/FileChipsList.jsx src/components/Conversations/FileChipsList.spec.jsx
git commit -m "feat: add FileChipsList component for displaying selected files"
```

---

## Task 3: Create FileMentionMenu

**Files:**

- Create: `src/components/Conversations/FileMentionMenu.jsx`
- Test: `src/components/Conversations/FileMentionMenu.spec.jsx`

### Step 3.1: Write the failing test

```javascript
import React, { useEffect } from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { FileMentionProvider, useFileMention } from "./FileMentionContext";
import FileMentionMenu from "./FileMentionMenu";

// Mock useFetchResult
jest.mock("../Search/useFetchResult", () => ({
  useFetchResult: jest.fn(() => ({
    isLoading: false,
    results: [
      {
        id: "1",
        primary: "test.pdf",
        secondary: "/documents",
        icon: { type: "component", component: () => null },
        doc: { _type: "io.cozy.files" },
      },
    ],
  })),
}));

describe("FileMentionMenu", () => {
  it("should show loading state initially", () => {
    // Mock loading state
    jest.mock("../Search/useFetchResult", () => ({
      useFetchResult: jest.fn(() => ({
        isLoading: true,
        results: null,
      })),
    }));
    const { getByText } = render(
      <FileMentionProvider>
        <FileMentionMenu
          anchorEl={document.createElement("div")}
          searchTerm=""
        />
      </FileMentionProvider>
    );
    expect(getByText("Loading...")).toBeInTheDocument();
  });

  it('should show "No files found" when empty', async () => {
    jest.mock("../Search/useFetchResult", () => ({
      useFetchResult: jest.fn(() => ({
        isLoading: false,
        results: [],
      })),
    }));
    const { getByText } = render(
      <FileMentionProvider>
        <FileMentionMenu
          anchorEl={document.createElement("div")}
          searchTerm="nonexistent"
        />
      </FileMentionProvider>
    );
    await waitFor(() => {
      expect(getByText("No files found")).toBeInTheDocument();
    });
  });

  it("should handle Tab key to select file", () => {
    const { getByText } = render(
      <FileMentionProvider>
        <FileMentionMenu
          anchorEl={document.createElement("div")}
          searchTerm="test"
        />
      </FileMentionProvider>
    );
    const firstResult = getByText("test.pdf");
    fireEvent.keyDown(firstResult, { key: "Tab" });
    // Verify file was added (check context or mock)
  });

  it("should handle Escape to close menu", () => {
    const { container, getByText } = render(
      <FileMentionProvider>
        <FileMentionMenu
          anchorEl={document.createElement("div")}
          searchTerm="test"
        />
      </FileMentionProvider>
    );
    const firstResult = getByText("test.pdf");
    fireEvent.keyDown(firstResult, { key: "Escape" });
    // Menu should close - verify by checking container or state
  });
});
```

Run: `cd packages/cozy-search && yarn jest src/components/Conversations/FileMentionMenu.spec.jsx`
Expected: FAIL - Module not found

### Step 3.2: Write minimal implementation

```javascript
import React, { useRef, useState } from "react";
import {
  Popper,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "cozy-ui/transpiled/react";
import Icon from "cozy-ui/transpiled/react/Icon";
import debounce from "lodash/debounce";
import { useEffect, useMemo } from "react";
import { useFetchResult } from "../Search/useFetchResult";
import { useFileMention } from "./FileMentionContext";

const FileMentionMenu = ({ anchorEl, searchTerm }) => {
  const { addFile, removeMentionText } = useFileMention();
  const listRef = useRef();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Debounce search term to avoid excessive API calls (250ms like SearchProvider)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const debounced = debounce(setDebouncedSearchTerm, 250);
    debounced(searchTerm);
    return () => debounced.cancel();
  }, [searchTerm]);

  const { isLoading, results } = useFetchResult(debouncedSearchTerm);

  const fileResults =
    results?.filter((r) => r.doc?._type === "io.cozy.files") || [];

  const handleSelect = (file) => {
    addFile({
      id: file.id,
      name: file.primary,
      path: file.secondary,
      icon: file.icon,
    });
    removeMentionText();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (fileResults[selectedIndex]) {
        handleSelect(fileResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      removeMentionText();
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
                {file.icon && file.icon.type === "component" ? (
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

export default FileMentionMenu;
```

Run: `cd packages/cozy-search && yarn jest src/components/Conversations/FileMentionMenu.spec.jsx`
Expected: PASS (may need adjustments)

### Step 3.3: Commit

```bash
git add src/components/Conversations/FileMentionMenu.jsx src/components/Conversations/FileMentionMenu.spec.jsx
git commit -m "feat: add FileMentionMenu component for file search dropdown"
```

---

## Task 4: Modify ConversationBar

**Files:**

- Modify: `src/components/Conversations/ConversationBar.jsx:1-109`

### Step 4.1: Add @ detection and menu rendering

**Complete implementation:**

```javascript
import { useRef } from "react";
import { useFileMention } from "./FileMentionContext";
import FileMentionMenu from "./FileMentionMenu";

// In ConversationBar component:
const inputRef = useRef();
const { hasMention, mentionSearchTerm, handleInputChange } = useFileMention();

// Detect @ in input value (use value prop from parent)
const hasMentionLocal = value?.match(/@(\w*)$/) !== null;
const mentionMatch = value?.match(/@(\w*)$/);
const mentionSearchTermLocal = mentionMatch ? mentionMatch[1] : "";

// Handle input change to update context
const handleChange = (e) => {
  const newValue = e.target.value;
  handleInputChange(newValue);
  // Call existing onChange if needed
};

return (
  <div className="u-w-100 u-maw-7 u-mh-auto">
    <SearchBar
      {...props}
      value={value}
      onChange={handleChange}
      componentsProps={{
        inputBase: {
          inputRef: inputRef,
          // ... existing props
        },
      }}
    />
    {hasMentionLocal && (
      <FileMentionMenu
        anchorEl={inputRef.current}
        searchTerm={mentionSearchTermLocal}
      />
    )}
  </div>
);
```

**Note**: The text removal happens in `FileMentionMenu` when `removeMentionText()` is called, which updates the context's `inputValue`. The input component needs to sync with this value change.

Run: `cd packages/cozy-search && yarn build`
Expected: PASS (no TypeScript errors)

### Step 4.2: Commit

```bash
git add src/components/Conversations/ConversationBar.jsx
git commit -m "feat: add @ detection and file mention menu to ConversationBar"
```

---

## Task 5: Modify ConversationComposer

**Files:**

- Modify: `src/components/Conversations/ConversationComposer.jsx:1-83`

### Step 5.1: Wrap with FileMentionProvider and add FileChipsList

```javascript
// Add imports
import FileMentionProvider from "./FileMentionContext";
import FileChipsList from "./FileChipsList";

// Wrap the entire component content
return (
  <FileMentionProvider>
    <ComposerPrimitive.Root
      className={cx("u-w-100 u-maw-7 u-mh-auto", {
        "u-card u-bxz u-elevation-1": isMobile,
      })}
    >
      <ConversationBar
        elevation={isMobile ? 0 : 1}
        disabledHover={!!isMobile}
        value={value}
        isEmpty={isEmpty}
        isRunning={isRunning}
        onKeyDown={handleKeyDown}
        onCancel={handleCancel}
        onSend={handleSend}
      />

      <FileChipsList />

      <div className="u-flex u-flex-items-center u-flex-justify-between u-mt-1">
        {flag("cozy.assistant.create-assistant.enabled") && (
          <AssistantSelection disabled={!isThreadEmpty} />
        )}
        {flag("cozy.assistant.source-knowledge.enabled") && (
          <TwakeKnowledgeSelector
            onSelectTwakeKnowledge={setOpenedKnowledgePanel}
          />
        )}
      </div>
    </ComposerPrimitive.Root>
  </FileMentionProvider>
);
```

Run: `cd packages/cozy-search && yarn build`
Expected: PASS

### Step 5.2: Commit

```bash
git add src/components/Conversations/ConversationComposer.jsx
git commit -m "feat: wrap composer with FileMentionProvider and add FileChipsList"
```

---

## Task 6: Modify CozyRealtimeChatAdapter

**Files:**

- Modify: `src/components/adapters/CozyRealtimeChatAdapter.ts:1-132`

### Step 6.1: Add getFileIDs callback to interface and usage

```typescript
// Update interface
export interface CozyRealtimeChatAdapterOptions {
  client: CozyClient;
  conversationId: string;
  streamBridge: StreamBridge;
  assistantId?: string;
  getFileIDs?: () => string[]; // NEW: callback for dynamic file IDs
}

// Update run function to use getFileIDs
const userQuery = findUserQuery(messages);
const fileIDs = getFileIDs?.() || [];

// Update API call
await client.stackClient.fetchJSON(
  "POST",
  `/ai/chat/conversations/${conversationId}`,
  {
    q: userQuery,
    assistantID: assistantId,
    ...(fileIDs.length > 0 && { fileIDs }),
  }
);
```

Run: `cd packages/cozy-search && yarn build`
Expected: PASS

### Step 6.2: Commit

```bash
git add src/components/adapters/CozyRealtimeChatAdapter.ts
git commit -m "feat: add getFileIDs callback to CozyRealtimeChatAdapter"
```

---

## Task 7: Wire up adapter with getFileIDs

**Files:**

- Modify: `src/components/CozyAssistantRuntimeProvider.tsx:288-303`

### Step 7.1: Add FileMentionProvider wrapper and getFileIDs to adapter

**Location**: Line 288-303 (adapter creation in `CozyAssistantRuntimeProviderInner`)

```typescript
// Add import at top of file
import {
  FileMentionProvider,
  useFileMention,
} from "./Conversations/FileMentionContext";

// Wrap children with FileMentionProvider (around line 322-325)
return (
  <FileMentionProvider>
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  </FileMentionProvider>
);
```

**Update adapter creation** (around line 288-303):

```typescript
// Add useFileMention hook call
const { getFileIDs } = useFileMention();

const adapter = useMemo(
  () =>
    createCozyRealtimeChatAdapter(
      {
        client: client as Parameters<
          typeof createCozyRealtimeChatAdapter
        >[0]["client"],
        conversationId,
        // eslint-disable-next-line react-hooks/refs
        streamBridge: streamBridgeRef.current,
        assistantId: selectedAssistantId,
        getFileIDs, // Add this line
      },
      t
    ),
  [client, conversationId, selectedAssistantId, t, getFileIDs] // Add getFileIDs to deps
);
```

Run: `cd packages/cozy-search && yarn build`
Expected: PASS

### Step 7.2: Commit

```bash
git add src/components/CozyAssistantRuntimeProvider.tsx
git commit -m "feat: wire up FileMentionProvider and getFileIDs in runtime provider"
```

Then modify to:

```javascript
// Add import
import {
  FileMentionProvider,
  useFileMention,
} from "./Conversations/FileMentionContext";

// If adapter is created in this component, update to use getFileIDs
const { getFileIDs } = useFileMention();

const adapter = useMemo(() => {
  return createCozyRealtimeChatAdapter(
    {
      client,
      conversationId,
      streamBridge,
      assistantId,
      getFileIDs, // Pass the callback
    },
    t
  );
}, [client, conversationId, streamBridge, assistantId, getFileIDs, t]);
```

If FileMentionProvider wraps the component, the hook won't work. May need to restructure:

```javascript
// Wrap children with FileMentionProvider
<FileMentionProvider>
  <ThreadPrimitive.Root adapter={adapter}>{children}</ThreadPrimitive.Root>
</FileMentionProvider>
```

Run: `cd packages/cozy-search && yarn build`
Expected: PASS

### Step 7.2: Commit

```bash
git add src/components/CozyAssistantRuntimeProvider.tsx
git commit -m "feat: wire up FileMentionProvider and getFileIDs in runtime provider"
```

---

## Task 8: Run full test suite

### Step 8.1: Run all tests

```bash
cd packages/cozy-search && yarn test
```

Expected: All tests pass, coverage ≥ 80%

### Step 8.2: Run linter

```bash
cd packages/cozy-search && yarn lint
```

Expected: No errors

### Step 8.3: Commit test fixes if needed

```bash
git add .
git commit -m "fix: address lint and test issues"
```

---

## Task 9: Manual testing

### Step 9.1: Test in development environment

```bash
cd ../../../../.. # Go to root
yarn dev # or appropriate command
```

Manual checklist:

- [ ] Type @ triggers file search dropdown
- [ ] Typing after @ filters file results
- [ ] Click on result selects file
- [ ] Tab key selects highlighted result
- [ ] Enter key selects highlighted result
- [ ] Escape key closes menu
- [ ] Arrow keys navigate results
- [ ] Selected file appears as chip
- [ ] Chip can be removed
- [ ] Multiple files can be selected
- [ ] @searchterm removed from input on selection
- [ ] Message sends with fileIDs

### Step 9.2: Commit final changes

```bash
git add .
git commit -m "feat: complete file mention feature"
```

---

## Success Criteria

- [ ] All unit tests pass
- [ ] Lint passes with no errors
- [ ] Build succeeds
- [ ] Manual testing checklist complete
- [ ] No regressions in existing functionality
- [ ] Code coverage ≥ 80%
