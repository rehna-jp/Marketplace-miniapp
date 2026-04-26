# Core Coding Standards

Universal coding standards for Farcaster mini app development. This file is loaded as a prerequisite by all domain and feature rules that involve writing code.

---

## 🚨 CRITICAL: Database Schema - NEVER DELETE OR EDIT THE `kv` TABLE

**The `kv` table in `src/db/schema.ts` is REQUIRED and must NEVER be removed or modified.**

For complete details on database schemas, see `.llm/rules/database-persistence.md`

---

## 🚨 CRITICAL: SDK Files Are Read-Only

**NEVER read or modify TypeScript/JavaScript files in SDK folders:**

- ❌ `src/neynar-web-sdk/src/**/*.ts(x)`
- ❌ `src/neynar-farcaster-sdk/src/**/*.ts(x)`
- ❌ `src/neynar-db-sdk/src/**/*.ts`
- ❌ `src/app/api/**/*.ts`

**ONLY read these SDK documentation files:**

- ✅ `llms.txt` files (all directories)
- ✅ `.llm/*.llm.md` documentation files

**If you need SDK info**: Check `.llm.md` docs, not source code. This is a HARD RULE.

---

## 🚨 CRITICAL: Rule File Paths

All `.llm/` paths are RELATIVE to your current working directory:

- ✅ `.llm/rules/game-development.md`
- ❌ `/monorepo/packages/service.miniapp-generator/.llm/...`

---

## File Creation Discipline

**Only create files explicitly requested or necessary.**

**DO NOT create:**

- README files or .md documentation
- Barrel files / Index files (index.ts, index.tsx)
- Package.json, tsconfig.json, configuration files
- Test files unless testing is the task

---

## Tool Usage (CRITICAL)

**ALWAYS use specialized file tools instead of bash:**

| Operation      | Use        | NOT               |
| -------------- | ---------- | ----------------- |
| Read           | Read tool  | cat, head, tail   |
| Edit           | Edit tool  | sed, awk          |
| Write          | Write tool | echo >, cat <<EOF |
| Find files     | Glob tool  | find, ls          |
| Search content | Grep tool  | grep, rg          |

**Bash only for**: git, pnpm, docker, process management

**NEVER create scripts** (Python, shell, JS) for any purpose.

---

## Template Structure

```
src/
├── app/                              # READ-ONLY - Next.js routing only
│   ├── layout.tsx                    # Core template (READ-ONLY)
│   ├── page.tsx                      # Minimal wrapper (READ-ONLY)
│   └── api/                          # API routes (READ-ONLY)
├── features/                         # YOUR DEVELOPMENT AREA
│   ├── app/
│   │   ├── mini-app.tsx              # MAIN APP COMPONENT (LLM entry point)
│   │   ├── providers-and-initialization.tsx
│   │   └── types.ts                  # Global app-wide types (if needed)
│   └── [feature-name]/               # Feature modules
│       ├── tabs/                     # Tab components
│       ├── components/               # Feature components
│       ├── types.ts                  # Feature-specific types
│       ├── utilities.ts              # Logic/helpers
│       └── actions.ts                # Server actions
├── components/                       # Shared components
├── settings/app-settings.json        # App configuration (MUST customize)
├── neynar-db-sdk/                    # READ-ONLY (only llms.txt)
├── neynar-farcaster-sdk/             # READ-ONLY (only llms.txt, .llm/)
└── neynar-web-sdk/                   # READ-ONLY (only llms.txt, .llm/)
```

---

## SDK-First Development

**Before building anything:**

1. **Check UI components** → `node_modules/@neynar/ui/llms.txt`
2. **Check SDK components** → `src/neynar-*/llms.txt`
3. **Check API hooks** → Load domain rules
4. **Only then build custom**

**ALWAYS read specific .llm.md files for EVERY component/hook you use.**

---

## App Settings & Domain References

**ALWAYS use `publicConfig.homeUrl` when referencing the app's host/domain.**

```typescript
import { publicConfig } from "@/config/public-config";

// ✅ CORRECT - Use publicConfig for URLs and app metadata
const appUrl = publicConfig.homeUrl;
const shareUrl = `${publicConfig.homeUrl}/share/${id}`;

// ✅ CORRECT - App settings are available via publicConfig
const appName = publicConfig.name;

// ❌ WRONG - Never hardcode domains
const appUrl = "https://myapp.com";
const shareUrl = window.location.origin; // Unreliable in SSR
```

**Why**: The homeUrl is computed from environment variables at build time (`VERCEL_URL`, etc.). Using `publicConfig.homeUrl` ensures consistency across environments.

### 🚨 CRITICAL: Share URLs & Cast Composition

**When building ANY share functionality (share buttons, cast composition, social sharing), you MUST use `publicConfig.homeUrl` as the ONLY source for the app's URL.**

This ensures share URLs always point to the **production domain** (\*.neynar.app) rather than development/preview URLs.

```typescript
import { publicConfig } from "@/config/public-config";
import sdk from "@farcaster/miniapp-sdk";

// ✅ CORRECT - Share button using publicConfig.homeUrl
async function handleShare() {
  const shareUrl = `${publicConfig.homeUrl}/game/${gameId}`;
  await sdk.actions.composeCast({
    text: `Check out my score in ${publicConfig.name}!`,
    embeds: [shareUrl],
  });
}

// ✅ CORRECT - Building share links for display
function getShareableLink(path: string) {
  return `${publicConfig.homeUrl}${path}`;
}

// ❌ WRONG - Using window.location (will embed dev/preview URLs)
const shareUrl = `${window.location.origin}/game/${gameId}`;

// ❌ WRONG - Hardcoding URLs
const shareUrl = "https://my-app.vercel.app/game/123";

// ❌ WRONG - Using environment variables directly
const shareUrl = `https://${process.env.VERCEL_URL}/game/123`;
```

**Common share scenarios that MUST use publicConfig.homeUrl:**

- Farcaster cast composition (`sdk.actions.composeCast`)
- Share buttons that create casts
- "Copy link" functionality
- Social media share links
- Referral links
- Any URL that will be shared outside the app

**Available settings** (from `src/settings/app-settings.json` via `publicConfig`):

- `name`, `shortName` - App names
- `subtitle`, `description`, `shortDescription` - App metadata
- `tagline` - Marketing tagline
- `primaryCategory` - App category for Farcaster
- `tags` - Descriptive tags for filtering
- `splashBackgroundColor` - Loading screen background color
- `requiredChains` - Required blockchain networks (CAIP-2 format)

---

## 🚨 Environment Variables - You Have Full Control

**You can configure any environment variable the app needs.** When implementing features that require API keys, secrets, or configuration, you can add them yourself.

**NEVER ask the user to configure environment variables.** You can do this yourself.

### Adding New Environment Variables

1. **Add to `.env`** (create if it doesn't exist) - contains real values (and is NOT committed to source)
2. **Add to `.env.example`** (create if it doesn't exist) - documents what's needed (and is committed to source)
3. **Use in your code** via `process.env.VARIABLE_NAME`

The dev server automatically detects `.env` changes - no restart needed.

**Example - Adding an API key:**

```bash
# .env
MY_API_KEY=actual-secret-value

# .env.example
MY_API_KEY=your-api-key-here
```

```typescript
// Server action or API route
const response = await fetch("https://api.example.com/data", {
  headers: {
    Authorization: `Bearer ${process.env.MY_API_KEY}`,
  },
});
```

**Common environment variables already available:**

- `NEYNAR_API_KEY` - Neynar API access
- `DATABASE_URL` - PostgreSQL database connection
- `OPENAI_API_KEY` - OpenAI API access

---

## File Naming (CRITICAL)

**ALWAYS kebab-case. NEVER PascalCase or camelCase.**

```typescript
✅ user-profile.tsx
✅ trading-dashboard.tsx
✅ use-game-audio.ts
❌ UserProfile.tsx
❌ tradingDashboard.tsx
```

---

## Type Organization

**Types belong with their feature, NOT in a central config folder.**

```typescript
// ✅ Feature-specific types
src / features / game / types.ts; // Game types (GameState, Enemy, etc.)
src / features / trading / types.ts; // Trading types (Trade, Position, etc.)

// ✅ App-wide global types (when truly shared)
src / features / app / types.ts; // Global types used across features

// ❌ NEVER create types in config/
src / config / types.ts; // Reserved for app-settings types ONLY
```

**Rule**: If a type is only used by one feature, it goes in that feature's `types.ts`. If truly shared across multiple features, use `features/app/types.ts`.

---

## Import Standards

```typescript
// ✅ Absolute imports only
import { Component } from "@/components/component";
import { UserAvatar } from "@/neynar-farcaster-sdk/mini";
import { Button } from "@neynar/ui";

// ❌ No relative imports
import { Component } from "./component";
```

**Extensions**: Include `.ts` for TypeScript, `.js` for JavaScript files.

---

## SDK Import Paths

### Neynar Farcaster SDK - Mini App Components

```typescript
// Core mini app features
import {
  useFarcasterUser, // Current logged-in user
  StandardMiniLayout, // Standard layout
  UserAvatar, // User components
} from "@/neynar-farcaster-sdk/mini";

// Audio features - MUST use /audio path
import {
  useSfx,
  useSong, // Audio hooks
  MuteButton, // Mute control
  AudioControl, // Volume control
  sfx, // Built-in sound effects
} from "@/neynar-farcaster-sdk/audio";

// Game features - MUST use /game path
import {
  GameMiniLayout, // Game layout with tabs
  useGameScore, // Score tracking
  useGameTimer, // Timer system
  useGameControls, // Control handling
} from "@/neynar-farcaster-sdk/game";
```

**Use for**: Current user context, layouts, audio, game engine

**CRITICAL**: Audio and game features have their own import paths - do NOT import from `/mini`

### Neynar Web SDK - Social & API Hooks

```typescript
import {
  useUser, // Fetch ANY user by FID
  useFollowingFeed, // Social feeds
  useCast,
  useChannel, // Cast/channel data
} from "@/neynar-web-sdk/neynar";

import { ExperimentalCastCard } from "@/neynar-web-sdk";
import { useCoinGeckoPrice } from "@/neynar-web-sdk/coingecko";
```

**Use for**: Farcaster data, social features, feeds

### Neynar UI - Design System

```typescript
import { Button, Card, Input, H1, Tabs, toast, Toaster } from "@neynar/ui";
```

### Common Confusion: useUser vs useFarcasterUser

```typescript
// Current logged-in user's FID
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";
const { data: user } = useFarcasterUser();
const myFid = user?.fid;

// Any user's full profile by FID
import { useUser } from "@/neynar-web-sdk/neynar";
const { data: profile } = useUser(someFid);
```

---

## Function Declaration Standard

```typescript
// ✅ Function declarations
function MyComponent() { return <div />; }

// ❌ Const expressions
const MyComponent = () => { return <div />; };
```

---

## TypeScript Strict Mode Patterns

Project uses `"strict": true`. ALL null/undefined cases MUST be handled.

### Ref Handling

```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
const ctx = canvasRef.current?.getContext("2d");
if (!ctx) return;
```

### Optional Arrays

```typescript
gameState.aliens?.forEach((alien) => update(alien));
const count = gameState.aliens?.length ?? 0;
```

### Event Handlers

```typescript
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
}
```

### Optional Props

```typescript
function Component({
  value,
  callback,
}: {
  value?: number;
  callback?: () => void;
}) {
  const v = value ?? 10;
  callback?.();
}
```

### Quick Reference

| Error                     | Fix                            |
| ------------------------- | ------------------------------ |
| Object possibly null      | Use `?.` or `if (!obj) return` |
| Object possibly undefined | Use `??` or guard clause       |
| Parameter implicitly any  | Add type annotation            |
| Cannot invoke undefined   | Use `callback?.()`             |

---

## Feature Organization

### Entry Point Pattern

**src/app/page.tsx** (READ-ONLY):

```typescript
"use client";
import { MiniApp } from "@/features/app/mini-app";
export default function Home() { return <MiniApp />; }
```

**src/features/app/mini-app.tsx** (YOUR MAIN APP):

```typescript
import { StandardMiniLayout } from "@/neynar-farcaster-sdk/mini";
import { Container, H1 } from "@neynar/ui";

export function MiniApp() {
  return (
    <StandardMiniLayout>
      <Container className="mt-6">
        <H1>My App</H1>
      </Container>
    </StandardMiniLayout>
  );
}
```

### Game with Tabs

```typescript
import { GameMiniLayout } from "@/neynar-farcaster-sdk/game";
import { useSong } from "@/neynar-farcaster-sdk/audio";
import { PlayTab } from "@/features/game/tabs/play-tab";
import { LeaderboardTab } from "@/features/game/tabs/leaderboard-tab";

export function MiniApp() {
  return (
    <GameMiniLayout
      tabs={[
        { label: "Play", content: <PlayTab /> },
        { label: "Leaderboard", content: <LeaderboardTab /> },
      ]}
    />
  );
}
```

---

## Server vs Client Components

**Template uses client components** (page.tsx has `'use client'`).

**Client components** (WITH 'use client'):

- ✅ React hooks, event handlers, browser APIs, @neynar/ui components

**Server components** (WITHOUT 'use client'):

- ✅ Async data fetching, database functions
- ❌ Cannot use hooks, event handlers, Context

**Common Error**: "createContext only works in Client Components"
**Fix**: Ensure `src/app/page.tsx` has `'use client'`

---

## Mobile-First Design

- **Maximum 2 columns** in any grid
- **424x695px** target size
- **No horizontal scrolling**
- **Vertical layouts** using Stack component

---

## JSX Tag Balance

**"Unterminated regexp literal"** = unbalanced JSX tags

The error line is NOT where the problem is - search earlier in the file. Count opening vs closing tags.

---

## Technology Stack

- Next.js 15.4.7 with App Router
- React 19.1.1 with TypeScript 5.x
- @neynar/ui component library
- Wagmi 2.16.4 + Viem 2.34.0
- TailwindCSS 4.x
