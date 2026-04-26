# Debugging Rules

Universal debugging patterns that apply inline during any workflow or standalone.

## When to Apply

Apply these patterns when:

- User reports: "fix", "broken", "not working", "error", "bug"
- User pastes a build error or TypeScript error
- Validation fails during any workflow phase
- MCP tools show errors in app code

---

## Debug Process

### 🚨 CRITICAL: ALWAYS Run Build After Fixing Errors

**After making ANY fix, you MUST run `pnpm run build` to verify the fix works.**

This is non-negotiable because:

- Runtime checks miss TypeScript errors that only appear at build time
- Vercel deployments run `pnpm run build` — if it fails there, you've wasted time
- Type mismatches, import errors, and syntax issues are caught by the build

```bash
pnpm run build
```

**Do NOT consider a fix complete until `pnpm run build` passes.**

---

### 🚨 CRITICAL: ALWAYS Use Next.js DevTools MCP First

**Your FIRST action when debugging MUST be to check the runtime:**

```
mcp__next-devtools__nextjs_runtime
```

This shows you:

- Runtime errors and stack traces
- Console logs from the app
- Network errors
- React hydration issues

**Do NOT guess at what's wrong. Check the logs first.**

### 1. Gather Context

1. **FIRST**: Call `mcp__next-devtools__nextjs_runtime` to get errors/logs (port 3021)
2. Read `docs/REQUIREMENTS.md` or `docs/VIBE-SPEC.md` to understand expected behavior
3. If needed, call `mcp__next-devtools__nextjs_docs` to look up Next.js patterns

### 2. Add Console Logging for Runtime/Logic Issues

If `nextjs_runtime` shows the app running but behavior is wrong, **temporarily add console.log statements** to trace the issue:

```typescript
console.log("[DEBUG] user data:", user);
console.log("[DEBUG] state before update:", currentState);
```

Then check the logs via `mcp__next-devtools__nextjs_runtime` - you'll see both server and browser console output.

**Remember to remove debug logs after fixing the issue.**

### 3. Diagnose

Look for in the runtime output:

- TypeScript errors in app code (not SDK paths - ignore those)
- Hydration mismatches
- Module resolution issues
- Runtime errors from stack traces
- Console.error messages

### 4. Fix

- Fix root cause, not symptoms
- Load relevant feature rules if needed
- Follow `core-coding-standards.md` patterns

### 5. Validate (MANDATORY BUILD STEP)

**REQUIRED - Run build to verify fix:**

```bash
pnpm run build
```

- Build must complete without errors
- Call `mcp__next-devtools__nextjs_runtime` again - should show 0 app errors
- No new runtime errors in logs
- Test the specific feature

**If build fails:** Fix the new errors and run build again. Do NOT report success until build passes.

---

## SDK Error Filtering (CRITICAL)

**NEVER attempt to fix errors in these paths:**

- `node_modules/@neynar/*`
- `src/neynar-farcaster-sdk/*`
- `src/neynar-web-sdk/*`
- `src/app/api/*`

**Only fix errors in:**

- `src/components/*`
- `src/features/*`
- `src/config/*`

---

## Common Error Patterns & Fixes

| Error                    | Symptom                           | Fix                                                                                                                                               |
| ------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| White screen             | createContext in server component | Add `'use client'` to component                                                                                                                   |
| Hydration mismatch       | Server/client HTML differs        | `suppressHydrationWarning` or fix conditional                                                                                                     |
| Module not found         | Import path wrong                 | Use `@/` absolute imports                                                                                                                         |
| Unterminated regexp      | Unbalanced JSX tags               | Count opening/closing tags, fix imbalance                                                                                                         |
| Object possibly null     | TypeScript strict mode            | Use `?.` or guard clause                                                                                                                          |
| Parameter implicitly any | Missing type annotation           | Add explicit type                                                                                                                                 |
| Cannot invoke undefined  | Optional callback                 | Use `callback?.()` syntax                                                                                                                         |
| Type not assignable      | Schema/app type mismatch          | See "Database Type Mismatches" below                                                                                                              |
| Wallet won't open        | Transaction fails before prompt   | Validate address with `isAddress()` from viem — likely truncated/invalid address. See `blockchain.md` § "ALWAYS Validate User-Provided Addresses" |

---

## Database Type Mismatches (COMMON)

**Error pattern:**

```
Type 'string' is not assignable to type '"option1" | "option2" | "option3"'
```

**Root cause:** Your app defines strict union types, but Drizzle schema returns `string`.

**Example:**

```typescript
// Your app expects:
type Category = "origins" | "reactions" | "symbols";

// But Drizzle returns:
{
  category: string;
} // From text("category") in schema
```

**Fixes:**

1. **Use InferSelectModel** (RECOMMENDED):

```typescript
import { InferSelectModel } from "drizzle-orm";
import { myTable } from "@/db/schema";
type MyType = InferSelectModel<typeof myTable>;
```

2. **Cast in server action:**

```typescript
export async function getData() {
  const results = await db.select().from(myTable);
  return results.map((r) => ({
    ...r,
    category: r.category as Category,
  }));
}
```

3. **Widen your app types** to match schema:

```typescript
type MyType = {
  category: string; // Accept what DB returns
};
```

**See `.llm/rules/database-persistence.md` for complete type safety guidance.**

---

## API Hook Mistakes (EXTREMELY COMMON)

### Wrong Package

- ❌ `import from "@neynar/react"` - DOES NOT EXIST
- ✅ `import from "@/neynar-web-sdk/neynar"` - Correct for API hooks

### Wrong Path

- ❌ `import from "@/neynar-farcaster-sdk/react"` - NO /react export
- ❌ `import from "@/neynar-farcaster-sdk/context"` - NO /context export
- ✅ `import from "@/neynar-farcaster-sdk/mini"` - Correct for Farcaster SDK

### @neynar/ui Imports

- ❌ `import { Dialog } from "@neynar/ui/dialog"` - NO subpackage imports
- ✅ `import { Dialog, Button, Card } from "@neynar/ui"` - Main export only

### Hook Confusion

```typescript
// Get CURRENT logged-in user's FID
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";
const { data: user } = useFarcasterUser();
const myFid = user?.fid;

// Fetch ANY user's data by FID
import { useUser } from "@/neynar-web-sdk/neynar";
const { data: profile } = useUser(someFid);
```

### Search Hooks Require Strings

```typescript
// ✅ CORRECT - Initialize as empty string
const [searchTerm, setSearchTerm] = useState("");
const result = useChannelSearch(searchTerm);

// ❌ WRONG - undefined crashes .trim()
const [searchTerm, setSearchTerm] = useState();
const result = useChannelSearch(searchTerm); // CRASHES!
```

---

## Game Control Hooks (COMMON MISTAKE)

**These hooks DO NOT EXIST:**

- ❌ `useGameControls()`
- ❌ `useButtonPress()`
- ❌ `useArrowPress()`

**Correct pattern:**

```typescript
import {
  useInitializeGame,
  useGameActionHandlers,
} from "@/neynar-farcaster-sdk/game";

// 1. Register handlers
useInitializeGame({
  actions: {
    left: { handler: () => moveLeft(), allowRepeat: true },
    right: { handler: () => moveRight(), allowRepeat: true },
    action: { handler: () => jump() },
  },
});

// 2. Get handlers for UI
const handlers = useGameActionHandlers();
```

---

## Blockchain Transaction Failures (COMMON)

### Wallet Prompt Never Appears

**Symptom:** User clicks a pay/send button, gets "Transaction failed" toast, but the wallet prompt never opens.

**Root cause (most likely):** Invalid recipient address. If the address is malformed (wrong length, invalid characters), viem/wagmi rejects it during ABI encoding BEFORE the wallet is prompted.

**Debug steps:**

1. Check the recipient address with `isAddress()` from viem
2. Verify it is exactly 42 characters (0x + 40 hex chars)
3. Check if it was hardcoded from user input — users often truncate addresses when pasting

**Fix:** Correct the address. See `.llm/rules/blockchain.md` § "ALWAYS Validate User-Provided Addresses".

---

## Validation Strategy

**Avoid validation loops** - don't fix one error, validate, fix another, validate...

**Better approach:**

1. Run validation ONCE
2. Collect ALL errors
3. Fix ALL errors together
4. Run validation ONCE to verify
5. Repeat if needed (batch fixes)

**Maximum 3 validation cycles** - if still failing, report to user.

---

## TypeScript Strict Mode Quick Reference

| Pattern         | Fix                                           |
| --------------- | --------------------------------------------- |
| Ref null        | `canvasRef.current?.getContext("2d")`         |
| Optional prop   | `value ?? defaultValue` or `callback?.()`     |
| Array undefined | `items?.forEach()` or `items ?? []`           |
| Find result     | `if (found) { use(found) }`                   |
| Event handler   | `(e: React.MouseEvent<HTMLButtonElement>) =>` |

---

## Validation Checklist

Before marking work complete:

- [ ] **`pnpm run build` passes** (MANDATORY - this catches TypeScript errors that runtime misses)
- [ ] `mcp__next-devtools__nextjs_runtime` - 0 errors in app code (ignore SDK paths)
- [ ] No runtime console errors in logs
- [ ] App opens without errors
- [ ] Core features work as designed
- [ ] All file names use kebab-case
- [ ] All imports use correct paths

**⚠️ The build step is NON-NEGOTIABLE.** Skipping it leads to deployment failures on Vercel.
