# Assistant App Actions — Client-Side Demo

**Date:** 2026-07-08
**Status:** Approved design, pending implementation plan
**Scope:** `packages/cozy-search` only. No cozy-stack or openRAG change.
**Purpose:** Demo. Deliberately simple; not the long-term action architecture.

## Context

The assistant chat (cozy-search UI → cozy-stack `rag-query` worker → openRAG) is text-only
end-to-end today:

- cozy-stack never sends `tools` to openRAG and drops any streamed delta that is not a text
  string (`model/rag/chat.go:527`), so real OpenAI tool-calling cannot flow through the
  conversation pipeline without changes in all three repos.
- However, cozy-stack already exposes `POST /ai/v1/chat/completions` (`web/ai/ai.go:55`): a
  permission-gated (POST on `io.cozy.ai.chat.conversations`) proxy that forwards any
  OpenAI-style body to openRAG with the instance's RAG credentials. Non-streaming.
  With a direct-LLM model name (empty/default, see openRAG `is_direct_llm_model`), openRAG
  skips retrieval and its `[Sources: N]` answer-style prompt — the body reaches the LLM
  untouched.
- `@assistant-ui/react` 0.12.5 (already used) supports `tool-call` content parts and
  `makeAssistantToolUI` for rendering custom cards, unused so far.

This demo adds **client-side app actions**: the user asks in natural language ("create a note
summarizing this discussion", "create a calendar meeting with X on Friday"), the assistant
replies with a sentence plus an **action card**, and the action executes only when the user
clicks it (confirm-first).

## Goals

- Two capabilities: **create a note** (real execution) and **create a calendar event**
  (deep-link prefill).
- Confirm-first: nothing is created until the user clicks the card.
- Zero backend change; degradation to the normal chat flow whenever anything fails.

## Non-goals

- Persisting action exchanges (they live in the local runtime only and vanish on reload).
- Real OpenAI tool-calling through the conversation pipeline (3-repo change; later).
- Server-side execution or the stack's `/ai/v1/tools/execute` proxy.
- Multi-step autonomous chains.
- Writing to Twake Calendar via CalDAV/OpenPaaS (deep-link only).
- LLM-based intent routing (regex only, by design for the demo).

## Architecture

```
user message
   │
   ▼
CozyRealtimeChatAdapter.run
   │  capability regex match?
   ├─ no ──────────────► normal flow: POST /ai/chat/conversations/{id} (unchanged)
   └─ yes
       ▼
POST /ai/v1/chat/completions  (direct-LLM model, non-streaming)
   system: "reply ONLY with JSON {sentence, action, params}" + capability schema
   messages: recent local conversation + user message
       │
       ▼  parse JSON (tolerate ```fenced``` blocks)
   ├─ parse fails ─────► fall back to normal flow (demo never dead-ends)
   └─ ok
       ▼
adapter yields: text part (sentence) + tool-call part (toolName=capability.id, args=params)
       ▼
makeAssistantToolUI card:  proposed ──click──► executing ──► done (link) / error (retry)
       ▼
capability.execute(params, client)
```

## Components (all under `packages/cozy-search/src/components/actions/`)

### 1. Capability registry — `capabilities.ts`

One entry per capability:

```ts
interface Capability {
  id: 'create_note' | 'create_event'
  match: (text: string) => boolean        // FR + EN keyword regexes
  paramsPrompt: string                    // JSON schema fragment for the side-call prompt
  Card: AssistantToolUI                   // registered via makeAssistantToolUI
  execute: (params, client) => Promise<{ url?: string }>
}
```

Adding a capability = adding one entry. The registry is shaped like a tool definition
(name, params schema, renderer, executor) so a future migration to real tool-calling
replaces only the transport (regex + side-call), not the actions.

Intent regexes are FR + EN keyword combinations, e.g. for `create_note`:
verb (`crée|créer|create|make|rédige|write`) AND object (`note`). For `create_event`:
verb AND (`réunion|meeting|rendez-vous|rdv|event|événement|visio`). Case-insensitive.
False positives are acceptable: the JSON parse + confirm card make a wrong match cheap,
and parse failure falls back to normal chat.

### 2. Intent detection & side-call — in `adapters/CozyRealtimeChatAdapter.ts`

- On `run`, test the outgoing user text against each capability's `match`.
- No match → existing behavior, byte-for-byte unchanged.
- Match → POST `/ai/v1/chat/completions` via `client.stackClient.fetchJSON` with:
  - `model`: the direct-LLM default (no `ragondin-{domain}` prefix → no retrieval).
  - `messages`: a system prompt — "You fill parameters for an app action. Reply ONLY with a
    JSON object `{ "sentence": string, "action": string, "params": object }`. `sentence`
    answers the user in their language, e.g. 'Sure — here is the calendar invitation,
    click it to confirm.'" — plus the capability's `paramsPrompt`, then the recent local
    conversation messages (so "summary of this discussion" has material), then the user
    message.
  - `stream: false`.
- Extract JSON from the response content: try `JSON.parse` on the whole content, then on the
  first ` ```json …``` ` fenced block, then on the first `{…}` span. Validate `action`
  matches the detected capability and `params` has the required keys.
- Any failure (HTTP error, no JSON, wrong shape) → silently run the normal conversation flow
  with the original message.

### 3. Rendering — assistant-ui tool UIs

- The adapter yields an assistant message with two content parts:
  `{ type: 'text', text: sentence }` and
  `{ type: 'tool-call', toolName: capability.id, toolCallId, args: params }`.
- Each capability's `Card` is registered with `makeAssistantToolUI` inside the runtime
  provider. Card shows a title, a param summary (note title / event title, date, attendee),
  and one primary button.
- Card state machine: `proposed → executing → done | error`. `done` shows a link
  (note URL / nothing for deep-link, which opens a tab). `error` shows the message and a
  retry button. State is local component state (not persisted).
- These messages exist only in the local runtime: after reload the exchange is gone.
  Accepted for the demo; stated here so nobody files it as a bug.

### 4. Execution

**`create_note`** — params `{ title: string, content: string /* markdown */ }`.
`client.stackClient.fetchJSON('POST', '/notes', …)` with a `io.cozy.notes` document:
title + default schema + content converted from simple markdown (headings, paragraphs,
bullet lists; anything else degrades to plain paragraphs) to the ProseMirror doc the notes
API expects. Done-state link = the note's open URL (fetch via the notes `/open` route or
build from the returned file id). **To verify at implementation:** the host app's manifest
must hold the notes/files permission; if the demo app lacks it, add it to the demo host's
manifest.

**`create_event`** — params `{ title: string, start: ISO datetime, end?: ISO datetime,
attendee?: string }`.
Build the Twake Calendar new-event URL with prefilled query params and `window.open` it.
**To verify at implementation:** exact deep-link format against the deployed Twake
Calendar; if no prefill params exist, open the calendar's new-event view without prefill
and keep the params visible on the card so the user can copy them.

### 5. Error handling

| Failure | Behavior |
|---|---|
| Side-call HTTP error / timeout | Fall back to normal chat flow with the original message |
| LLM output not parseable / wrong shape | Same fallback |
| `execute` rejects (e.g. 403 on /notes) | Card → error state with message + retry button |
| User ignores the card | Card stays in `proposed` state as inert history |

## Testing

- Unit tests for the two fragile spots: capability regex matching (FR/EN positives +
  negatives) and JSON extraction (bare JSON, fenced block, prose-wrapped, garbage).
- Card state machine tests with a mocked `execute` (proposed → executing → done / error).
- Adapter branch test: non-matching message goes through the untouched normal flow.
- Manual E2E: run the actual demo script (note summary + calendar meeting) against a dev
  instance.

## Migration note (post-demo)

The long-term direction is real tool-calling through the pipeline (openRAG schema: `tool`
role + nullable content; cozy-stack: forward `tools`, stop dropping non-text deltas, new
realtime event; frontend: structured parts in `StreamBridge`). The capability registry is
the stable piece: cards and executors carry over; only regex detection and the side-call
are replaced.
