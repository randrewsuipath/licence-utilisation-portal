# UiPath SDK App Template

## 1. Overview
React single-page application with the official UiPath TypeScript SDK (`@uipath/uipath-typescript`). Deployed as a static site on Cloudflare Pages.
- Frontend: React 18 + TypeScript + ShadCN UI + Tailwind CSS
- Auth: OAuth via `useAuth` hook (`src/hooks/useAuth.tsx`)
- SDK: `@uipath/uipath-typescript` with constructor-based service instantiation
## IMPORTANT: Demo Content
The existing `HomePage.tsx` is a placeholder. Replace it with actual application pages.

## Development Restrictions
- **Tailwind Colors**: Hardcode custom colors in `tailwind.config.js`, NOT in `index.css`
- **Components**: Use existing ShadCN components instead of writing custom ones
- **Icons**: Import from `lucide-react` directly
- **Error Handling**: ErrorBoundary components are pre-implemented
- **NEVER use mock data** - always use real data from UiPath SDK services

---

## 2. UiPath Services Overview

Understand what each service area represents before using its SDK module:

- **Orchestrator Processes** — the core execution unit in UiPath. A "process" can be an RPA automation, an agentic process (AI agent), or a case management process. **To start any of these — including Maestro processes, cases, or agents — use `Processes.start()`** from `@uipath/uipath-typescript/processes`. The SDK does not have a dedicated agent service, but agents are processes and can be started the same way.
- **Buckets** — cloud storage buckets used by automations to store and retrieve files (documents, data exports, etc.).
- **Assets** — key-value configuration stored in Orchestrator (credentials, settings, connection strings) that automations read at runtime.
- **Queues** — work queues that hold transaction items for automations to process (e.g., invoice records, customer requests).
- **Entities (Data Fabric)** — structured data tables in UiPath's Data Service. Think of them as tables with schema, records, and relationships. ChoiceSets are enum-like picklists for entity fields.
- **Tasks (Action Center)** — human-in-the-loop tasks or escalations created by automations when human input/approval is needed. Users can create, assign, reassign, and complete tasks.
- **Maestro Processes & Cases** — orchestration layer for complex workflows. MaestroProcesses are monitored process definitions; ProcessInstances are running executions. Cases are long-running business cases with stages. **To start a Maestro process or case, use `Processes.start()`** (they are Orchestrator processes underneath).
- **Process Incidents** — errors or exceptions that occur during process instance execution.

## 3. SDK Module Import Table

| Subpath | Classes |
|---------|---------|
| `@uipath/uipath-typescript/core` | `UiPath`, `UiPathError`, `UiPathSDKConfig`, pagination types |
| `@uipath/uipath-typescript/entities` | `Entities`, `ChoiceSets` |
| `@uipath/uipath-typescript/tasks` | `Tasks` |
| `@uipath/uipath-typescript/maestro-processes` | `MaestroProcesses`, `ProcessInstances`, `ProcessIncidents` |
| `@uipath/uipath-typescript/cases` | `Cases`, `CaseInstances` |
| `@uipath/uipath-typescript/assets` | `Assets` |
| `@uipath/uipath-typescript/queues` | `Queues` |
| `@uipath/uipath-typescript/buckets` | `Buckets` |
| `@uipath/uipath-typescript/processes` | `Processes` |

Types, enums, and option interfaces are exported from the same subpath as their service class.

## 4. Type-Driven Development Rules

When using any SDK service method, follow these rules strictly:

1. **Always import the response type** from the same subpath as the service class. Example: `import type { AssetGetResponse } from '@uipath/uipath-typescript/assets'`
2. **Read the imported interface** to know what fields are available. Only access properties defined in the type. Never guess field names.
3. **Import option types** for method parameters. Example: `import type { AssetGetAllOptions } from '@uipath/uipath-typescript/assets'`
4. **Import enums** from the SDK for any field that uses an enum value. Example: `import { TaskPriority, TaskType, TaskStatus } from '@uipath/uipath-typescript/tasks'`
5. **Use `OperationResponse<T>`** type for mutation results (import from `@uipath/uipath-typescript`). Has shape `{ success: boolean; data: T }`.
6. **Method-attached responses**: Some `getById`/`getAll` responses include callable methods. The response type is a union: `EntityGetResponse = RawEntityGetResponse & EntityMethods`. Read the `*Methods` interface to know available instance methods.
7. **Reference files are your primary source.** The `sdk-reference/` files in this template contain all method signatures, types, enums, and fields you need. **Do NOT explore `node_modules` or the SDK source code if the information is already in a reference file.** Only fall back to `node_modules/@uipath/uipath-typescript/` as a last resort when the reference files don't cover something (e.g., a newly added method or an edge case not documented). Check `.d.ts` files for types if you must.

## 5. Anti-Patterns — NEVER Do These

- **NEVER import service classes from the root package** (`import { Entities } from '@uipath/uipath-typescript'`). Service classes are only available via subpath imports: `@uipath/uipath-typescript/entities`, `/tasks`, `/processes`, etc. The root export only has the deprecated legacy `UiPath` class and type interfaces.
- **NEVER use deprecated dot-chain access** like `sdk.entities.getAll()` or `sdk.maestro.processes.instances.getVariables(...)`. The legacy `UiPath` class from `@uipath/uipath-typescript` supports this but it is **deprecated**. Always use constructor-based DI: `import { UiPath } from '@uipath/uipath-typescript/core'` and `const entities = new Entities(sdk)`.
- **NEVER guess field names** on response objects. Import the response type and read its interface. Fields differ across services and don't follow a single pattern.
- **NEVER call paginated methods without `pageSize`** for production use. Unpaginated calls fetch all records and can be slow or hit limits.
- **NEVER call `sdk.initialize()` more than once.** It triggers the full OAuth redirect. Use `sdk.isAuthenticated()` or `useAuth().isAuthenticated` to check status first.
- **NEVER mix `folderId` (number) with `folderKey` (string).** Orchestrator services (Assets, Queues, Buckets, Processes) use numeric `folderId`. Maestro services (ProcessInstances, CaseInstances) use string `folderKey`. Using the wrong type will silently fail or return empty results.
- **NEVER hardcode resource IDs** (folder IDs, process IDs, queue IDs, etc.) — always fetch them from the SDK at runtime. If the user does not specify exact IDs, fetch available resources first and let the user select from real data.
- **NEVER access `result.value` on SDK responses.** The SDK does NOT use OData's `.value` convention. Paginated responses use `result.items`. Non-paginated responses may return an array directly (e.g. `Entities.getAll()` returns `EntityGetResponse[]`). Read the method signature to know the return type.


## 6. Authentication

The template provides `src/hooks/useAuth.tsx` with `AuthProvider` and `useAuth` hook.

### useAuth hook API

```typescript
const { isAuthenticated, isInitializing, sdk, login, logout, error } = useAuth();
```

| Field | Type | Description |
|---|---|---|
| `isAuthenticated` | `boolean` | Whether the user has a valid token |
| `isInitializing` | `boolean` | True during login/initialization |
| `sdk` | `UiPath \| null` | The SDK instance — pass to service constructors |
| `login` | `() => Promise<void>` | Triggers OAuth login flow (redirects to UiPath) |
| `logout` | `() => void` | Calls `sdk.logout()` to clear authentication state |
| `error` | `string \| null` | Auth error message, if any |

### How auth works

1. **On mount**, `AuthProvider` checks `sdk.isInOAuthCallback()`. If the user is returning from the OAuth redirect, it calls `sdk.completeOAuth()` to exchange the auth code for tokens.
2. **Login** calls `sdk.initialize()`, which redirects the user to UiPath's OAuth consent page.
3. **After consent**, UiPath redirects back to the app. Step 1 detects the callback and completes the flow.
4. **Logout** calls `sdk.logout()` which clears all stored authentication credentials, session data, and resets the SDK state. Requires re-initialization (`sdk.initialize()`) to authenticate again.
5. **Token refresh** is automatic. When a service call gets a 401, the SDK refreshes the token using the refresh token internally. App code never needs to handle this.
6. **Token persistence**: OAuth tokens are stored in `sessionStorage` (key: `uipath_sdk_user_token-{clientId}`), so they survive page refreshes within the same tab.

### Additional UiPath methods

These are available on the `sdk` instance from `useAuth()` but not directly exposed by the hook:

- **`sdk.isAuthenticated()`** — returns `boolean`. Check if user has a valid token.
- **`sdk.isInitialized()`** — returns `boolean`. Check if SDK has completed initialization.
- **`sdk.getToken()`** — returns `string | undefined`. The raw access token. Only needed for direct API calls outside the SDK or debugging.
- **`sdk.logout()`** — clears all stored authentication credentials and resets SDK state.
- **`sdk.config`** — read-only `{ baseUrl, orgName, tenantName }`. Useful for displaying the connected org/tenant in the UI.

### When to use what

| Scenario | What to use |
|---|---|
| Check if user is logged in | `isAuthenticated` from `useAuth()` |
| Show a login button | `login` from `useAuth()` |
| Log the user out | `logout` from `useAuth()` |
| Create a service instance | `new ServiceClass(sdk)` where `sdk` is from `useAuth()` |
| Pass token to a non-SDK API | `sdk.getToken()` |
| Show which org is connected | `sdk.config.orgName` |
| Guard a route before auth completes | `isInitializing` from `useAuth()` |

## 8. Service Usage Pattern in Components

**Data fetching rules — follow these for every component:**

1. **Always use pagination when available.** If a service method supports pagination, always pass `pageSize` and build pagination controls in the UI (next/previous buttons, page indicators). Never call `getAll()` without pagination options for methods that support it.
2. **Show data as it arrives.** Don't wait for all fetches to complete before rendering. Use independent loading states per data source so each section renders as soon as its data is ready.
3. **Fetch in parallel.** When a component needs data from multiple services, use `Promise.all()` or separate `useEffect` hooks with independent state — never await one fetch before starting another unrelated one.

SDK service pattern (use in every component):

```typescript
const { sdk } = useAuth();
const service = useMemo(() => sdk ? new ServiceClass(sdk) : null, [sdk]);

// Paginated (Orchestrator services): await service.getAll({ pageSize: 20 })
// Paginated with folder: await service.getAll({ folderId, pageSize: 20 })
// Non-paginated (e.g. Entities): await service.getAll()  // returns array directly
// By ID: await service.getById(id, folderId)
// Errors: catch (err) { err instanceof UiPathError ? err.message : 'Failed' }
// Parallel: const [a, b] = await Promise.all([svcA.getAll(...), svcB.getAll(...)])
```

**Key rule:** Most Orchestrator `getAll()` methods accept `folderId` as **optional**. Make an initial unscoped fetch (no folderId) to discover available resources and folders, then use scoped fetches after user selection. Never require a folderId before the first data load. Data Fabric services (Entities, ChoiceSets) are org-scoped and have no folder concept.

## 9. Pagination

Import pagination types from `@uipath/uipath-typescript/core`:

- `PaginationOptions`: `{ pageSize?, cursor?, jumpToPage? }` (cursor and jumpToPage are mutually exclusive)
- `PaginatedResponse<T>`: `{ items, hasNextPage, nextCursor?, previousCursor?, totalCount?, currentPage?, totalPages?, supportsPageJump }`
- `NonPaginatedResponse<T>`: `{ items, totalCount? }`

Behavior:
- No pagination options passed -> returns `NonPaginatedResponse<T>`
- Any pagination option passed (pageSize, cursor, or jumpToPage) -> returns `PaginatedResponse<T>`
- Some services (e.g. `Entities.getAll()`) don't support pagination at all and return a plain array

Cursor navigation example:

```typescript
// First page
const page1 = await service.getAll({ pageSize: 10 });

// Next page using cursor
if (page1.hasNextPage && page1.nextCursor) {
  const page2 = await service.getAll({ cursor: page1.nextCursor });
}

// Jump to page (only for offset-based services: Assets, Queues, Tasks, Entities)
const page5 = await service.getAll({ jumpToPage: 5, pageSize: 10 });
```

### Type narrowing for pagination responses

TypeScript narrows the return type at compile-time based on whether pagination options are passed. At runtime, use `'hasNextPage' in result` to discriminate — this field exists only on `PaginatedResponse`, never on `NonPaginatedResponse`.

```typescript
import type { PaginatedResponse } from '@uipath/uipath-typescript/core';

// Pattern 1: When you always pass pagination options, assert the type
const result = await tasks.getAll({ pageSize: 10 });
// TypeScript already infers PaginatedResponse here, but if using dynamic options:
const paginated = result as PaginatedResponse<TaskGetResponse>;

// Pattern 2: When options are dynamic and you don't know the return type
const result = await tasks.getAll(options);
if ('hasNextPage' in result) {
  // PaginatedResponse — safe to access nextCursor, supportsPageJump, etc.
  if (result.hasNextPage && result.nextCursor) {
    const nextPage = await tasks.getAll({ cursor: result.nextCursor });
  }
} else {
  // NonPaginatedResponse — only has items and totalCount
  console.log(`All ${result.items.length} items returned`);
}
```

## 10. Polling, BPMN Rendering & Embedding Action Tasks

For real-time data updates, process diagram visualization, and embedding HITL tasks, see the patterns reference.

**MANDATORY — read `sdk-reference/patterns.md`** when building components that need:
- Auto-refreshing data (polling hook implementation + SDK usage example)
- BPMN diagram rendering (`bpmn-js` setup, viewer component, fetching XML)
- Embedding Action Center tasks / HITL tasks / action apps inside the app via iframe (embed URL format, task link extraction from execution history, iframe component)

## 11. Error Handling

All SDK errors extend `UiPathError` (import from `@uipath/uipath-typescript/core`).

Specific error types: `AuthenticationError`, `AuthorizationError`, `ValidationError`, `NotFoundError`, `RateLimitError`, `ServerError`, `NetworkError`.

```typescript
import { UiPathError, AuthenticationError, NotFoundError } from '@uipath/uipath-typescript/core';

try {
  const result = await service.getById(id, folderId);
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Token expired, trigger re-login
  } else if (err instanceof NotFoundError) {
    // Resource not found
  } else if (err instanceof UiPathError) {
    // Other SDK error
    console.error(err.message);
  }
}
```

## 12. Service Reference Files

**MANDATORY — read the reference file for each service your component uses** before writing any service code. These contain exact method signatures, parameter types, response types, enums, and bound methods.

| Reference File | Services | When to read |
|-----------|----------|--------------|
| `sdk-reference/orchestrator.md` | `Assets`, `Queues`, `Buckets`, `Processes` | App uses Orchestrator resources or starts processes |
| `sdk-reference/data-fabric.md` | `Entities`, `ChoiceSets` | App reads/writes Data Service entities |
| `sdk-reference/action-center.md` | `Tasks` | App creates, assigns, or completes Action Center tasks |
| `sdk-reference/maestro.md` | `MaestroProcesses`, `ProcessInstances`, `ProcessIncidents`, `Cases`, `CaseInstances` | App monitors or manages process/case instances |
| `sdk-reference/pagination.md` | Pagination types and patterns | Always -- cursor navigation, type narrowing |
| `sdk-reference/patterns.md` | usePolling, BPMN viewer, embedded tasks | App needs auto-refreshing data, process diagram rendering, or embedded HITL tasks |

