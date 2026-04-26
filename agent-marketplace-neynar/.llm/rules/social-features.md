# Neynar API - Neynar Web SDK Core Rules

**CORE RULES FILE** - Loaded when working with Neynar social features

## Use Case

Using Neynar Web SDK for social features: user profiles, feeds, casts, channels, followers, notifications

## Prerequisites

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

## When to Load

Load when implementing:

- Social features
- User profiles/profile pages
- Feeds (following, for you, trending, channel feeds)
- Followers/following lists
- Casts (posts, conversations)
- Channels (discovery, feeds)
- Notifications
- User directories/search
- Social data display (likes, recasts, replies)

**Keywords:** social, users, feeds, followers, notifications, channels, casts, neynar, farcaster social data

---

## 🚨 CRITICAL: Neynar Web SDK Import Paths

**NO @neynar/react PACKAGE - IT DOES NOT EXIST!**

```typescript
// ✅ CORRECT - Neynar API hooks
import { useUser, useFollowingFeed, useChannel } from "@/neynar-web-sdk/neynar";
import { useTrendingFeed, useChannelSearch } from "@/neynar-web-sdk/neynar";

// ✅ CORRECT - CoinGecko crypto hooks
import { useCoinGeckoPrice } from "@/neynar-web-sdk/coingecko";

// ✅ CORRECT - Shared components (from base path, NOT /shared)
import { ExperimentalCastCard } from "@/neynar-web-sdk";

// ❌ WRONG - These paths/packages DO NOT EXIST
import { useTrendingFeed } from "@neynar/react"; // NO @neynar/react PACKAGE!
import { useUser } from "@/neynar-web-sdk/neynar-api/hooks"; // Old structure
import { ExperimentalCastCard } from "@/neynar-web-sdk/shared"; // No /shared suffix!
```

**Valid @neynar/\* packages (ONLY these):**

- `@neynar/ui` - UI components (Button, Card, Input, etc.)
- `@neynar/nodejs-sdk` - Server-side SDK only
- NO @neynar/react, @neynar/hooks, or any other variations!

---

## 🚨 CRITICAL: useUser vs useFarcasterUser - KNOW THE DIFFERENCE!

**DO NOT CONFUSE THESE TWO COMPLETELY DIFFERENT THINGS:**

### useUser - Fetch ANY user's data by FID

```typescript
// ✅ CORRECT - Import from Neynar Web SDK
import { useUser } from "@/neynar-web-sdk/neynar";

// Fetches public user data for ANY FID (not the logged-in user)
const { data: userData } = useUser(296632); // Fetches data for FID 296632
const { data: anyUser } = useUser(someFid); // Fetches data for any FID
```

**What it does**: Fetches Farcaster user data from Neynar API for ANY specified FID
**Returns**: Full user profile (username, display name, bio, pfp, follower counts, etc.)
**Use for**: Displaying other users' profiles, looking up user data by FID

### useFarcasterUser - Get the CURRENT logged-in user

```typescript
// ✅ CORRECT - Import from Farcaster SDK
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";

// Gets the CURRENT user who opened this mini app
const { data: user, isLoading, error } = useFarcasterUser();
const currentUserFid = user?.fid; // The logged-in user's FID
```

**What it does**: Provides the context of WHO opened the mini app (the current user)
**Returns**: Basic user context (fid, username, displayName, pfpUrl) - NOT full profile
**Use for**: Getting the current user's FID, personalizing the app for the logged-in user

### Common Pattern: Combine Both

```typescript
import { useUser } from "@/neynar-web-sdk/neynar";
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";

function MyProfile() {
  // Get current user's FID
  const { data: user, isLoading, error } = useFarcasterUser();
  const currentUserFid = user?.fid;

  // Fetch full profile data for current user
  const { data: fullProfile } = useUser(currentUserFid);

  return <div>{fullProfile?.bio}</div>;
}
```

### ⚠️ WRONG Imports That Don't Exist

```typescript
// ❌ THESE PATHS/IMPORTS DO NOT EXIST - DO NOT USE!
import { useUser } from "@/neynar-farcaster-sdk/context"; // NO /context PATH!
import { useUser } from "@/neynar-farcaster-sdk/mini"; // useUser NOT in farcaster SDK!
import { useFarcasterUser } from "@/neynar-web-sdk/neynar"; // WRONG SDK!
```

**Summary**:

- **Current user FID**: `useFarcasterUser()` from `@/neynar-farcaster-sdk/mini`
- **Any user's data**: `useUser(fid)` from `@/neynar-web-sdk/neynar`
- **Never mix the import paths!**

---

## CRITICAL: Research Required (MANDATORY)

**DO NOT skip to implementation after reading overview files!**

**Required research steps for EVERY hook:**

1. **Read overview** to identify candidate hooks:
   - `src/neynar-web-sdk/src/neynar/llms.txt` - Main overview with patterns

2. **Read catalog** for complete metadata:
   - `src/neynar-web-sdk/src/neynar/.llm/sdk-items-registry.json`
   - Shows: infinite queries, deprecated hooks, special constraints

3. **Read specific hook docs** for EACH hook you'll use:
   - `src/neynar-web-sdk/src/neynar/.llm/use-[hook-name].llm.md`
   - Contains: exact parameters, return types, usage examples, constraints

**ONLY after reading specific .llm.md files, proceed to implementation.**

**Common mistakes from shallow research:**

- Using infinite query hooks when instructed not to
- Wrong parameter limits (e.g., `limit: 25` when max is 10)
- Using deprecated hooks (e.g., `useTrendingChannels`)
- Incorrect assumptions about return types

**Why deep research matters:**

- Hook names, parameters, and limits are precisely documented
- Prevents trial-and-error debugging
- Avoids preventable TypeScript errors
- Ensures correct-first-time implementation

---

## Critical Hook Patterns

**Understanding Hook Return Types:**

There are TWO types of query hooks with DIFFERENT return structures:

### Regular Query Hooks (Return Flat Arrays/Objects)

These hooks return data directly - no pagination structure:

```typescript
import { useUser, useBulkUsers } from "@/neynar-web-sdk/neynar";

// Single item → Direct object access
const { data: user } = useUser(123);
user?.username; // User | undefined

// Arrays (non-paginated) → Direct array access
const { data: users } = useBulkUsers([123, 456]);
users?.map((u) => u.username); // User[] - direct array
```

### Infinite Query Hooks (Return Structured Pages)

These hooks support pagination and return `data.pages` structure that you must flatten:

```typescript
import { useUserFollowers, useFollowingFeed } from "@/neynar-web-sdk/neynar";

// Infinite queries → Structured pages (must flatten)
const { data, fetchNextPage, hasNextPage } = useUserFollowers(123);
const followers = data?.pages.flatMap((page) => page.items) || [];
followers.map((f) => f.user.username); // Now a flat array

const { data: feedData } = useFollowingFeed(fid);
const casts = feedData?.pages.flatMap((page) => page.items) || [];
casts.map((cast) => cast.text); // Now a flat array
```

**❌ COMMON MISTAKES:**

```typescript
// ❌ Wrong: Treating infinite query data as flat array
const { data: followers } = useUserFollowers(123);
followers?.map((f) => f.user.username); // ERROR: data.pages exists, not data array

// ❌ Wrong: Hook names have "Neynar" prefix
import { useNeynarUser, useNeynarFeedFollowing } from "...";

// ❌ Wrong: Import path (outdated structure)
import { useUser } from "@/neynar-web-sdk/neynar-api/hooks";
```

**✅ CORRECT:**

```typescript
// ✅ Infinite queries: Flatten pages first
const { data } = useFollowingFeed(fid);
const casts = data?.pages.flatMap((page) => page.items) || [];
casts.map((cast) => cast.text);

// ✅ Regular queries: Direct access
const { data: users } = useBulkUsers([123, 456]);
users?.map((u) => u.username);

// ✅ Correct hook names (no "Neynar" prefix)
import { useUser, useFollowingFeed } from "@/neynar-web-sdk/neynar";
```

**How to Know Which Type:**

- Check the hook's `.llm.md` file - infinite queries have `fetchNextPage` and `hasNextPage` in return type
- Or check if you need pagination controls - if yes, it's an infinite query hook

---

## Essential Social Hooks

Import from `@/neynar-web-sdk/neynar`:

### Users

**Regular queries (direct access):**

- `useUser(fid)` → `User | undefined`
- `useBulkUsers(fids)` → `User[]`

**Infinite queries (flatten pages):**

- `useUserSearch(query)` → Paginated `User[]` (use `data.pages.flatMap(p => p.items)`)
- `useUserFollowers(fid)` → Paginated `Follower[]` (use `data.pages.flatMap(p => p.items)`)
- `useUserFollowing(fid)` → Paginated `Follower[]` (use `data.pages.flatMap(p => p.items)`)
- `useUserActiveChannels(fid)` → Paginated `Channel[]` (use `data.pages.flatMap(p => p.items)`)

### Feeds (All Infinite Queries - Flatten Pages)

All feed hooks return paginated data - flatten with `data.pages.flatMap(p => p.items)`:

- `useFollowingFeed(fid)` - User's following feed
- `useForYouFeed(fid)` - Personalized feed
- `useTrendingFeed()` - Trending casts
- `useChannelFeed(channelId)` - Channel feed
- `useChannelAndChildFeed(channelId)` - Channel + child channels
- `useMultiChannelFeed(channelIds[])` - Multiple channels

### Casts

**Regular queries (direct access):**

- `useCast(hash)` → `Cast | undefined`
- `useBulkCasts(hashes)` → `Cast[]`

**Infinite queries (flatten pages):**

- `useCastsByUser(fid)` → Paginated `Cast[]` (use `data.pages.flatMap(p => p.items)`)
- `useCastConversation(hash)` → Paginated conversation data (flatten pages)

### Channels

**Regular queries (direct access):**

- `useChannel(channelId)` → `Channel | undefined`
- `useBulkChannels(channelIds[])` → `Channel[]`

**Infinite queries (flatten pages):**

- `useChannelSearch(query)` → Paginated `Channel[]` (use `data.pages.flatMap(p => p.items)`)

### Notifications (Infinite Queries - Flatten Pages)

- `useNotifications(fid)` → Paginated notifications (use `data.pages.flatMap(p => p.items)`)

### ⚠️ Mutation Hooks (DO NOT USE YET)

While mutation hooks are available in the SDK, **DO NOT use them yet**. They exist and are documented but are not ready for production use:

- ❌ `useFollowUser()`, `useUnfollowUser()` - Social relationship mutations
- ❌ `useLikeCast()`, `useUnlikeCast()` - Cast engagement mutations
- ❌ `usePublishCast()`, `useDeleteCast()` - Cast creation/deletion mutations
- ❌ `useFollowChannel()`, `useUnfollowChannel()` - Channel subscription mutations
- ❌ All other mutation hooks (blocks, mutes, etc.)

**DO NOT delete these hooks** - they are part of the SDK. Just don't use them in app code yet.

**For now, ONLY use query hooks** (hooks that fetch/read data, not mutate/write data).

**Documentation:** `src/neynar-web-sdk/src/neynar/llms.txt` + `.llm/*.llm.md`

---

## Social-Specific Patterns

### ExperimentalCastCard Component

**⚠️ EXPERIMENTAL**: Pre-built component for displaying Farcaster casts with full feature support.

```typescript
import { ExperimentalCastCard } from '@/neynar-web-sdk';
import { useChannelFeed } from '@/neynar-web-sdk/neynar';

function CastFeed({ channelId }: { channelId: string }) {
  const { data } = useChannelFeed(channelId);
  const casts = data?.pages.flatMap(p => p.items) || [];

  return (
    <div className="space-y-4">
      {casts.map(cast => (
        <ExperimentalCastCard
          key={cast.hash}
          cast={cast}
          onCastClick={(cast) => console.log('Cast clicked:', cast.hash)}
          onAuthorClick={(cast) => console.log('Author clicked:', cast.author.username)}
        />
      ))}
    </div>
  );
}
```

**Features:**

- Author info (avatar, display name, username, power badge)
- Cast text with proper wrapping
- Image and link embeds
- Nested/quoted casts (recursive)
- Engagement metrics (likes, recasts, replies)
- Built with @neynar/ui components

**Props:**

- `cast: Cast` - Required cast object
- `onCastClick?: (cast: Cast) => void` - Optional click handler
- `onAuthorClick?: (cast: Cast) => void` - Optional author click handler
- `className?: string` - Optional additional CSS classes
- `nested?: boolean` - Internal flag for nested casts

**Documentation:** `src/neynar-web-sdk/src/shared/.llm/experimental-cast-card.llm.md`

### User Profile Card

```typescript
import { Card, CardContent, H3, Small } from '@neynar/ui';
import { UserAvatar } from '@/neynar-farcaster-sdk/mini';
import { useUser } from '@/neynar-web-sdk/neynar';

function UserProfile({ fid }: { fid: number }) {
  const { data: user } = useUser(fid);
  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <UserAvatar user={user} />
        <H3 className="truncate">{user.display_name}</H3>
        <Small color="muted">@{user.username}</Small>
      </CardContent>
    </Card>
  );
}
```

### Feed with Pagination

```typescript
import { Card, CardContent, P, Button } from '@neynar/ui';
import { useFollowingFeed } from '@/neynar-web-sdk/neynar';

function Feed({ fid }: { fid: number }) {
  const { data, fetchNextPage, hasNextPage } = useFollowingFeed(fid);
  const casts = data?.pages.flatMap(p => p.items) || [];

  return (
    <div className="space-y-4">
      {casts.map(cast => (
        <Card key={cast.hash}>
          <CardContent><P>{cast.text}</P></CardContent>
        </Card>
      ))}
      {hasNextPage && <Button onClick={() => fetchNextPage()}>Load More</Button>}
    </div>
  );
}
```

### Followers List

```typescript
import { Card, CardContent, P, Button } from '@neynar/ui';
import { useUserFollowers } from '@/neynar-web-sdk/neynar';

function FollowersList({ fid }: { fid: number }) {
  const { data, fetchNextPage, hasNextPage } = useUserFollowers(fid);
  const followers = data?.pages.flatMap(p => p.items) || [];

  return (
    <div className="space-y-3">
      {followers.map(f => (
        <Card key={f.user.fid}>
          <CardContent><P>{f.user.display_name}</P></CardContent>
        </Card>
      ))}
      {hasNextPage && <Button onClick={() => fetchNextPage()}>Load More</Button>}
    </div>
  );
}
```

---

## Social-Specific Rules

### 1. Always Truncate User Content

```typescript
// ✅ CORRECT - Prevents overflow
<P className="truncate">{user.display_name}</P>
<Small className="truncate">@{user.username}</Small>

// ❌ WRONG
<P>{user.display_name}</P>
```

### 2. Use min-w-0 for Flex Truncation

```typescript
// ✅ CORRECT - Truncation works
<div className="flex-1 min-w-0">
  <P className="truncate">{user.display_name}</P>
</div>

// ❌ WRONG - Truncation fails
<div className="flex-1">
  <P className="truncate">{user.display_name}</P>
</div>
```

### 3. Flatten Infinite Query Pages

```typescript
// ✅ CORRECT - Infinite queries need flatMap
const { data } = useFollowingFeed(fid);
const casts = data?.pages.flatMap((page) => page.items) || [];
casts.map((cast) => cast.text);

// ❌ WRONG - Trying to map directly on data
const { data: casts } = useFollowingFeed(fid);
casts?.map((cast) => cast.text); // ERROR: data.pages exists, not array
```

### 4. Use UserAvatar Component

```typescript
// ✅ CORRECT
import { UserAvatar } from '@/neynar-farcaster-sdk/mini';
<UserAvatar user={user} />

// ❌ WRONG
<img src={user.pfp_url} className="rounded-full" />
```

### 5. Handle All States

```typescript
const { data: users, isLoading, error } = useBulkUsers(fids);

if (isLoading) return <Skeleton />;
if (error) return <P color="destructive">Failed to load</P>;
if (!users?.length) return <EmptyState title="No users" />;

return <UserList users={users} />;
```

---

## Common Mistakes

1. **Wrong hook names** - ❌ `useNeynarUser` → ✅ `useUser`
2. **Wrong imports** - ❌ `@/neynar-web-sdk/neynar-api/hooks` → ✅ `@/neynar-web-sdk/neynar`
3. **Not flattening infinite queries** - Must use `data.pages.flatMap(p => p.items)` for paginated hooks
4. **Missing truncation** - Always truncate user-generated content
5. **Missing min-w-0** - Required for flex truncation to work
6. **Custom avatars** - Use `UserAvatar` component instead
7. **Missing pagination** - Use `fetchNextPage` for infinite queries with long lists

---

**Summary**: Neynar API hooks use `@/neynar-web-sdk/neynar` imports (no "Neynar" prefix), distinguish between regular queries (direct access) and infinite queries (must flatten pages), and require careful text truncation with `min-w-0` for proper mobile display.
