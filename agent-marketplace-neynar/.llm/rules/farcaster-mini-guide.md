# Farcaster Mini App SDK Guide

## Prerequisites

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

High-level guide to the Farcaster Mini App SDK features and when to use them.

---

## 📚 SDK Documentation

**For complete API documentation and implementation details, see:**

`src/neynar-farcaster-sdk/src/mini/llms.txt`

This guide provides an overview of SDK features. The SDK's llms.txt contains:

- Complete setup instructions
- Detailed API reference
- Common patterns and best practices
- Troubleshooting guide

---

## Overview

The Farcaster Mini App SDK (`@/neynar-farcaster-sdk/mini`) provides core functionality for building Farcaster mini applications:

### Core Features

**1. Farcaster Integration**

- User authentication and context
- SDK initialization
- Guest user handling

**2. Layout Components**

- Pre-built mini app layouts
- Headers and navigation
- Responsive design patterns

**3. User Components**

- User avatars
- User profiles
- Display components

**4. Utilities**

- Metadata generation
- Helper functions

---

## When to Use This SDK

**Use Farcaster Mini SDK when:**

- Building a Farcaster mini application
- Need to access the current user who opened the app
- Need Farcaster-specific layouts and UI components
- Managing mini app state and navigation
- Handling guest users (users who open outside Farcaster client)

**Don't use when:**

- Fetching data about other users → Use `@/neynar-web-sdk/neynar` hooks
- Building general UI components → Use `@neynar/ui`
- Server-side API calls → Use `@/neynar-web-sdk/api-handlers`

---

## Quick Feature Reference

### Getting Current User

**Hook**: `useFarcasterUser()`
**Returns**: Current user who opened the mini app (or null for guests)
**Common use**: Get FID, username, display name of current user

```typescript
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";

const { data: user, isLoading, error } = useFarcasterUser();
const fid = user?.fid;
```

**See SDK docs for**: Complete hook API, loading states, error handling, guest user patterns

---

### SDK Initialization

**Hook**: `useInitializeFarcasterApp()`
**Purpose**: Initialize the Farcaster SDK (call once in providers wrapper)
**Common use**: App setup and initialization

```typescript
// Call in your providers wrapper component
useInitializeFarcasterApp();
```

**See SDK docs for**: Setup patterns, provider configuration, initialization lifecycle

---

### Layout Components

**Components**: `StandardMiniLayout`, `MiniappHeader`
**Purpose**: Pre-built layouts for mini apps
**Common use**: Standard app structure with header and content area

```typescript
import { StandardMiniLayout } from "@/neynar-farcaster-sdk/mini";

<StandardMiniLayout>
  <YourContent />
</StandardMiniLayout>
```

**See SDK docs for**: Layout options, customization, responsive behavior

---

### User Display

**Component**: `UserAvatar`
**Purpose**: Display user profile pictures
**Common use**: Show avatars in lists, profiles, headers

```typescript
import { UserAvatar } from "@/neynar-farcaster-sdk/mini";

<UserAvatar user={user} className="size-12" />
```

**See SDK docs for**: Size variants, fallback behavior, styling

---

## Common Scenarios

### Scenario 1: Display Current User Profile

**What you need**: `useFarcasterUser()` + `UserAvatar`
**SDK docs section**: Farcaster Integration → useFarcasterUser

### Scenario 2: Fetch Additional User Data

**What you need**: `useFarcasterUser()` to get FID, then `useUser(fid)` from web SDK
**Related guide**: `.llm/rules/social-features.md`

### Scenario 3: Handle Guest Users

**What you need**: `useFarcasterUser()` with null check
**SDK docs section**: Common Patterns → Guest User Detection

### Scenario 4: Owner-Only Features

**What you need**: `useFarcasterUser()` to check FID against creator FID
**Related file**: `src/settings/app-settings.json` (creator FID via publicConfig)

---

## Critical Distinctions

### useFarcasterUser vs useUser

**THESE ARE DIFFERENT HOOKS FROM DIFFERENT SDKS:**

- **`useFarcasterUser()`** from `@/neynar-farcaster-sdk/mini`
  - Gets the CURRENT user (who opened the app)
  - Returns immediately with cached context
  - Returns null for guest users
  - Use when: You need to know WHO is using the app

- **`useUser(fid)`** from `@/neynar-web-sdk/neynar`
  - Fetches data about ANY user by FID
  - Makes API call, returns full profile
  - Can fetch other users' data
  - Use when: You need profile data for a specific user

**See**: `.llm/rules/social-features.md` for detailed comparison

---

## Feature SDKs

The Farcaster SDK includes optional feature modules:

### Game Features

**Import from**: `@/neynar-farcaster-sdk/game`
**Documentation**: `src/neynar-farcaster-sdk/src/mini/features/game/llms.txt`
**Guide**: `.llm/rules/game-development.md`

Comprehensive game development primitives including scoring, timers, persistence, effects, and more.

### Audio Features

**Import from**: `@/neynar-farcaster-sdk/audio`
**Documentation**: `src/neynar-farcaster-sdk/src/mini/features/audio/llms.txt`
**Guide**: `.llm/rules/audio-system.md`

Complete audio system with sound effects and music synthesis.

---

## When to Load This File

Load farcaster-mini-guide.md when:

- User asks about Farcaster SDK features
- Need to understand what the Farcaster SDK provides
- Deciding which SDK to use for a feature
- User asks about current user context
- Need overview before diving into SDK docs

**After loading this guide, load the SDK's llms.txt for implementation details.**

---

## Related Documentation

- **Implementation details**: `src/neynar-farcaster-sdk/src/mini/llms.txt`
- **Available features**: See available-features-index in system prompt
- **Social features**: `.llm/rules/social-features.md`
- **Game development**: `.llm/rules/game-development.md`
- **Audio system**: `.llm/rules/audio-system.md`
