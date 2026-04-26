# Database Persistence - DB SDK Core Rules

**CORE RULES FILE** - Loaded when data storage/persistence is required

## Use Case

Database integration and data persistence for storing application state, user data, game scores, and structured data

## Prerequisites

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

<step-0-provision>
## STEP 0: Ensure Database is Provisioned (MANDATORY)

Before using any database or KV store features, check `<system-context>` for `Database Status`.

**If "not provisioned":**

1. Determine whether the user has their own database:
   - If the user mentioned having their own PostgreSQL database or provided a
     connection string, use BYO mode.
   - Otherwise, briefly ask: "Your app needs to store data. Do you have your
     own PostgreSQL database you'd like to use, or should I set one up for you?"
   - If no preference stated, auto-provision (most users won't have their own).

2. Call `mcp__neynar-app-studio__provision_database`:
   - Always pass `deploymentId` from `<system-context>` → **Deployment ID**
   - BYO: also pass `connectionString` (must be a full `postgres://` connection string)
   - Auto: omit `connectionString` — a Neon PostgreSQL database is created automatically

3. After the tool succeeds, `DATABASE_URL` is injected into the pod environment.
   Read it from `process.env.DATABASE_URL` and write it to `.env`.

4. Proceed to Step 1 (Evaluate Data Storage Needs)

**If "provisioned" or tool returns `alreadyProvisioned: true`:**
Proceed directly to Step 1.

**BYO requirements:**

- Must be PostgreSQL (other databases are not supported by the Drizzle + pg stack)
- Must be a full connection string (e.g., `postgres://user:password@host:5432/dbname`)
- The connection is validated before saving — if invalid, you'll get an error
  with details. Ask the user to double-check their credentials.

</step-0-provision>

<step-1-evaluation>
## STEP 1: Evaluate Data Storage Needs (MANDATORY)

**This step applies to ALL create/modify workflows BEFORE writing any code.**

**ALWAYS ask yourself**: Does the user's request require storing data?

**Indicators that data storage is needed**:

- User-generated content (posts, comments, submissions)
- Game scores or achievements
- Leaderboards or rankings
- User preferences or settings (beyond localStorage)
- Form submissions or surveys
- Lists, favorites, bookmarks
- Any data that needs to survive page refresh or be shared across users
- Historical data or activity logs

If the application has data requirements, you must:

1. **Ask clarifying questions about the data** (in plain English, not technical jargon):
   - "Should the leaderboard show highest single score or total of all scores?"
   - "Do you want to track individual game sessions or just the best score?"
   - "Should users be able to see their history or just current state?"
2. **Propose your data model to the user** (in simple terms):
   - "I'll track each game score with the player's name, their score, and when they played"
   - Get confirmation before proceeding

**Data Storage Options:**

1. **Database (Drizzle + PostgreSQL)** - For structured data, relationships, queries
   - Best for: Leaderboards, user-generated content, complex data models
   - Example: "I'll use a database to store all game scores and player profiles"
   - Note: Requires schema setup (handled by database rules below)

2. **KV Store (Key-Value)** - For simple key-value data, fast reads/writes
   - **Built-in and ready to use** - no schema setup required
   - Best for: User preferences, simple counters, session data, app config, simple flags
   - Example: "I'll use the built-in KV store to save your high score and settings"
   - Note: Details in KV Store sections below

3. **localStorage** - For device-specific client-side preferences only
   - **Acceptable for**: Audio volume/mute, UI theme, device-specific settings
   - **NOT for**: User data, scores, content, or anything that should sync across devices
   - localStorage data is lost when: user clears browser data, switches devices, or uses different browser
   - Example: "I'll use localStorage to remember your volume setting on this device"

**Choose based on requirements**:

- Complex queries/relationships → Database tables
- Simple key-value data shared across devices → KV Store
- Device-specific UI preferences → localStorage
- Multiple options might work - choose the simplest one that meets the requirements

**If data storage is NOT needed, you can skip the rest of this file.**

**If data storage IS needed, continue reading this file for complete implementation guidance.**

</step-1-evaluation>

<data-model-planning>
## Data Model Planning - REQUIRED FIRST STEP

**Context**: You are implementing a data model that has already been confirmed with the user.

### Understand the Data Requirements

Before writing schema, consider:

- What data needs to be stored?
- How will users interact with this data? (view, search, filter, sort)
- What relationships exist between different pieces of data?
- What queries will the UI need to make?

### Translate Requirements to Drizzle Schema

**Mapping Requirements → Drizzle Types:**

| User Said                    | Drizzle Type                                                                 | Import                                                |
| ---------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| "username" / "name" / text   | `text("field_name")`                                                         | `import { text } from "drizzle-orm/pg-core"`          |
| "score" / "count" / number   | `integer("field_name")`                                                      | `import { integer } from "drizzle-orm/pg-core"`       |
| "price" / decimal            | `real("field_name")` or `numeric("field_name", { precision: 10, scale: 2 })` | `import { real, numeric } from "drizzle-orm/pg-core"` |
| "when played" / "created at" | `timestamp("field_name").defaultNow()`                                       | `import { timestamp } from "drizzle-orm/pg-core"`     |
| "true/false" / yes/no        | `boolean("field_name")`                                                      | `import { boolean } from "drizzle-orm/pg-core"`       |
| Unique ID                    | `uuid("id").primaryKey().defaultRandom()`                                    | `import { uuid } from "drizzle-orm/pg-core"`          |
| "Farcaster ID" / user ID     | `integer("fid")`                                                             | `import { integer } from "drizzle-orm/pg-core"`       |
| Optional field               | Add `.notNull()` to required fields only                                     |                                                       |
| JSON data                    | `jsonb("field_name")`                                                        | `import { jsonb } from "drizzle-orm/pg-core"`         |

**Common Schema Patterns:**

```typescript
// Game leaderboard table
export const gameScores = pgTable("game_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").notNull(), // User who played
  username: text("username").notNull(), // Display name
  score: integer("score").notNull(), // Game score
  level: integer("level").notNull(), // Level reached
  createdAt: timestamp("created_at").defaultNow().notNull(), // When played
});

// User favorites table
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").notNull(), // Who favorited
  castHash: text("cast_hash").notNull(), // What was favorited
  note: text("note"), // Optional - no .notNull()
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User preferences table (alternative to KV store for structured prefs)
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").notNull().unique(), // One row per user
  theme: text("theme").default("light").notNull(),
  notifications: boolean("notifications").default(true).notNull(),
  settings: jsonb("settings"), // Complex nested config
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Table Naming Conventions:**

- Use snake_case for table names: `game_scores`, not `gameScores` or `GameScores`
- Use snake_case for column names: `created_at`, not `createdAt` or `CreatedAt`
- Use plural for tables: `users`, `scores`, `favorites`
- Export const uses camelCase: `export const gameScores = pgTable("game_scores", ...)`

**CRITICAL - What Queries Will You Need?**

Before finalizing schema, think about the server actions you'll create:

- **Leaderboard**: Need `orderBy(desc(gameScores.score)).limit(10)` → Include `score` field
- **User history**: Need `where(eq(gameScores.fid, fid))` → Include `fid` field
- **Recent activity**: Need `orderBy(desc(gameScores.createdAt))` → Include `createdAt` field
- **Search by name**: Need `where(like(users.username, pattern))` → Include `username` field

**Make sure your schema includes all fields needed for your queries!**

</data-model-planning>

<decision-tree>
## KV Store vs Custom Tables - Decision Guide

**STEP 1: Does your data need to be queried, filtered, or sorted?**

**YES** → Use Custom Tables (requires schema setup)

- Examples: Leaderboards (sort by score), user profiles (filter by criteria), game history (query by date)
- You'll create server actions with queries like `orderBy`, `where`, `limit`

**NO** → Continue to STEP 2

**STEP 2: Does your data have multiple related fields per record?**

**YES** → Use Custom Tables (requires schema setup)

- Examples: User profile {name, bio, avatar, joinDate}, Game score {userId, score, level, timestamp}
- Better as structured table with multiple columns

**NO** → Continue to STEP 3

**STEP 3: Is this simple key-value data with no relationships?**

**YES** → Use KV Store (built-in, no schema needed)

- Examples: `user:123:theme = "dark"`, `app:counter = "42"`, `settings:mode = "easy"`
- Perfect for: Single user preferences, app config, simple flags/counters
- **Ready to use immediately** - No schema setup, no migrations required
- Built-in server actions: `kvGet()`, `kvSet()`, `kvDelete()`, `kvKeys()`, `kvGetAll()`
- Import from `@/neynar-db-sdk` and use in any component (client or server)
- All values are strings (use JSON.stringify/parse for objects)
- See `src/neynar-db-sdk/llms.txt` for complete function signatures and examples
  </decision-tree>

<patterns>

## 🚨🚨🚨 CRITICAL: Database Import Path 🚨🚨🚨

**THE ONLY CORRECT WAY TO IMPORT THE DATABASE CLIENT:**

```typescript
import { db } from "@/neynar-db-sdk/db";
```

**NEVER USE ANY OF THESE - THEY WILL FAIL:**

```typescript
// ❌ WRONG - Module not found
import { db } from "@/db";

// ❌ WRONG - Will cause bundler errors
import { db } from "@/neynar-db-sdk";

// ❌ WRONG - Path doesn't exist
import { db } from "@/db/index";

// ❌ WRONG - Path doesn't exist
import { db } from "@/database";
```

**MEMORIZE THIS**: `@/neynar-db-sdk/db` - this is the ONLY path that works.

---

## Overview

This file provides complete guidance for setting up database persistence using PostgreSQL with Drizzle ORM.

**Context**: You are a subagent that has been delegated database setup work. The main agent has confirmed the data model with the user and is delegating the implementation to you.

**Your responsibilities**:

1. Edit src/db/schema.ts with the designed models
2. Run pnpm run db:push to apply schema changes
3. Schema changes will take effect automatically
4. Create server actions for all CRUD operations
5. Test database operations
6. Report back to main agent with available server actions

**DO NOT**:

- ❌ Ask the user questions (main agent already did this)
- ❌ Re-plan the data model (already confirmed by main agent)
- ❌ Build UI components (that's the main agent's job)

**DO**:

- ✅ Implement the data model exactly as specified
- ✅ Follow all database patterns in this file
- ✅ Test that everything works
- ✅ Report results clearly

---

## ⚠️ BEFORE USING DATABASE: Schema Setup Required

**All database operations use Next.js server actions.**

Server actions are functions with `"use server"` that can be called from:

- Client components ('use client')
- Server components (async components)
- Other server actions

### File Structure for Database Code

**Protected SDK (DO NOT EDIT):**

- `src/neynar-db-sdk/src/db.ts` - Database client (import from `@/neynar-db-sdk/db`)
- `src/neynar-db-sdk/src/actions/kv-actions.ts` - Built-in KV server actions

**Your App Directory (CREATE YOUR FILES HERE):**

- `src/db/schema.ts` - Add your table definitions here

  **⚠️ CRITICAL: THE `kv` TABLE IS IMMUTABLE ⚠️**

  The `kv` table is a **required built-in table** that must NEVER be modified:
  - ❌ **NEVER DELETE**: The `kv` table definition from this file
  - ❌ **NEVER EDIT**: The table name, fields, types, or any part of the definition
  - ❌ **NEVER RENAME**: The table name or the exported constant
  - ❌ **NEVER MODIFY**: Any of the `kv` table's fields or properties
  - ❌ **NEVER COMMENT OUT**: The `kv` table export or any part of it
  - ❌ **NEVER ADD FIELDS**: To the `kv` table (it must remain exactly as defined)

  **What happens if you delete or edit the `kv` table:**
  1. Database schema conflicts during deployment
  2. Interactive prompts during `drizzle-kit push` that block app startup
  3. Deployment health check failures and timeouts
  4. The app will fail to start in production

  **What you CAN do:**
  - ✅ Add NEW table definitions below the `kv` table in `src/db/schema.ts`
  - ✅ Use the `kv` table via built-in server actions (`kvGet`, `kvSet`, etc.)
  - ✅ Create custom tables for structured data alongside the `kv` table

  **When modifying `src/db/schema.ts`:**
  1. ALWAYS keep the `kv` table definition exactly as it appears in the template
  2. NEVER change anything about the `kv` table - not even a comment or whitespace
  3. Add your custom tables AFTER the `kv` table
  4. Follow the examples shown in the schema file comments
  5. Never modify or remove ANY existing table definitions unless explicitly requested by the user

- `src/db/actions/` - Create your custom server actions here
  - Example: `src/db/actions/game-actions.ts`
  - Example: `src/db/actions/user-actions.ts`

**Import Pattern - FOLLOW EXACTLY:**

```typescript
// In your server actions (src/db/actions/*.ts):
import { db } from "@/neynar-db-sdk/db"; // ✅ ONLY correct path for db
import { myTable } from "@/db/schema"; // Your table definitions
import { eq, desc } from "drizzle-orm"; // Query helpers

// In your components:
import { myAction } from "@/db/actions/game-actions"; // Your server action
```

**⚠️ REMINDER: `@/neynar-db-sdk/db` is the ONLY valid import path for `db`.**

### Built-in KV Store Server Actions

The KV table exists by default. These server actions are ready to use:

```typescript
// Use in ANY component (client or server)
import { kvGet, kvSet } from '@/neynar-db-sdk';

// Client component example
'use client';
import { useState } from 'react';

function MyComponent({ fid }: { fid: number }) {
  const [theme, setTheme] = useState<string | null>(null);

  const handleSave = async () => {
    await kvSet(`user:${fid}:theme`, 'dark');
    const savedTheme = await kvGet(`user:${fid}:theme`);
    setTheme(savedTheme);
  };

  return <button onClick={handleSave}>Save Theme</button>;
}

// Server component example
async function MyServerComponent({ fid }: { fid: number }) {
  const theme = await kvGet(`user:${fid}:theme`);
  return <div>Theme: {theme ?? 'default'}</div>;
}
```

### Creating Server Actions for Custom Tables

**When you add custom tables, ALWAYS create server actions for them.**

**Step 1: Add table to schema**

Edit `src/db/schema.ts`:

```typescript
import { pgTable, uuid, integer, text, timestamp } from "drizzle-orm/pg-core";

export const gameScores = pgTable("game_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").notNull(),
  score: integer("score").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 2: Push schema to database**

```bash
pnpm run db:push
```

**Note:** Changes will take effect automatically through hot reload. The database client handles schema updates gracefully.

The `pnpm run db:push` command:

- Creates/updates the table in PostgreSQL
- Uses `--force` flag to auto-accept destructive changes
- **Configured to fail fast** on ambiguous changes (no interactive prompts)

### 🚨 CRITICAL: All Database Changes Must Be Backwards Compatible

**Generated apps may have users with existing data.** Schema changes MUST NOT break existing data or functionality.

**Backwards Compatibility Rules:**

1. **NEVER delete columns** - Existing code or data may depend on them
2. **NEVER rename columns or tables** - This appears as delete+add and breaks existing queries
3. **NEVER change column types** in a breaking way (e.g., text → integer)
4. **NEVER add NOT NULL constraints** to existing columns without defaults
5. **ALWAYS add new columns as nullable** or with sensible defaults
6. **ALWAYS use additive changes** - Add new things, don't remove or modify existing ones

**Why this matters:**

- Deployed apps have real users with real data
- Schema changes apply immediately on `db:push`
- Breaking changes = lost data or crashed apps
- There is no migration rollback - changes are permanent

**If you need to "rename" something:**

```typescript
// ✅ CORRECT - Add new column, keep old one working
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  username: text("username"), // Keep for backwards compatibility
  displayName: text("display_name"), // New column - nullable by default
});
// App code can read from both, write to new one
```

### 🚨 CRITICAL: Handling Schema Push Failures

**The `db:push` command will FAIL instead of prompting for input.** This is intentional.

**Common failure scenarios:**

1. **Renaming columns** - Drizzle cannot distinguish a rename from delete+add
2. **Renaming tables** - Same ambiguity issue
3. **Adding constraints to populated tables** - May require truncation
4. **Ambiguous schema changes** - Drizzle doesn't know your intent

**When db:push fails, you MUST make non-destructive changes:**

**❌ WRONG - Causes failure:**

```typescript
// Renaming 'username' to 'displayName'
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"), // ← Drizzle sees: delete username, add displayName?
});
```

**✅ CORRECT - Non-destructive approach:**

```typescript
// Step 1: Add new column alongside old one
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  username: text("username"), // Keep old column
  displayName: text("display_name"), // Add new column
});
// Later: migrate data from username to displayName
// Later still: remove username in a separate change
```

**Alternative strategies for non-destructive changes:**

- **Column renames:** Add new column → migrate data → remove old column (separate changes)
- **Table renames:** Create new table with desired name → copy data → drop old table
- **Adding unique constraints:** Ensure data is clean first, or make field nullable initially
- **Complex changes:** Break into multiple small, unambiguous steps

**If you see an error from `drizzle-kit push`:**

1. **Read the error message** - it will tell you what's ambiguous
2. **Re-analyze your schema change** - break it into smaller, clearer steps
3. **Use additive changes** - add new things first, remove old things later
4. **Test incrementally** - push smaller changes more frequently

**Step 3: Create server actions file**

**IMPORTANT**: Create server actions in `src/db/actions/` (your editable app directory), NOT in `src/neynar-db-sdk/src/actions/` (protected SDK directory).

**🚨 CRITICAL IMPORT**: Always use `import { db } from '@/neynar-db-sdk/db'` - NOT `@/db` or any other path!

Create `src/db/actions/game-actions.ts`:

```typescript
"use server";

import { db } from "@/neynar-db-sdk/db"; // ✅ CORRECT - the ONLY valid path
import { gameScores } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Save a game score
 */
export async function saveGameScore(
  fid: number,
  score: number,
  username: string,
) {
  await db.insert(gameScores).values({
    fid,
    score,
    username,
  });
}

/**
 * Get top scores for leaderboard
 */
export async function getTopScores(limit: number = 10) {
  return db
    .select()
    .from(gameScores)
    .orderBy(desc(gameScores.score))
    .limit(limit);
}

/**
 * Get a user's best score
 */
export async function getUserBestScore(fid: number) {
  const result = await db
    .select()
    .from(gameScores)
    .where(eq(gameScores.fid, fid))
    .orderBy(desc(gameScores.score))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get all scores for a user
 */
export async function getUserScores(fid: number) {
  return db
    .select()
    .from(gameScores)
    .where(eq(gameScores.fid, fid))
    .orderBy(desc(gameScores.createdAt));
}
```

**🚨🚨🚨 CRITICAL: Database Import Path 🚨🚨🚨**

✅ **THE ONLY CORRECT IMPORT:**

```typescript
import { db } from "@/neynar-db-sdk/db"; // ✅ CORRECT
import { gameScores } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
```

❌ **THESE WILL ALL FAIL:**

```typescript
import { db } from "@/db"; // ❌ Module not found
import { db } from "@/neynar-db-sdk"; // ❌ Can't resolve 'fs' error
import { db } from "@/db/index"; // ❌ Path doesn't exist
```

**Why `@/neynar-db-sdk/db`?** The main `@/neynar-db-sdk` export ONLY includes server actions. The `db` client is at the `/db` subpath.

**Step 4: Use in your app**

```typescript
// Client component
'use client';
import { saveGameScore, getTopScores } from '@/db/actions/game-actions';
import { useState, useEffect } from 'react';

function GameComponent() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    getTopScores(10).then(setScores);
  }, []);

  const handleGameEnd = async (score: number) => {
    await saveGameScore(123, score, 'player1');
    const newScores = await getTopScores(10);
    setScores(newScores);
  };

  return (
    <div>
      <button onClick={() => handleGameEnd(100)}>Save Score</button>
      <ul>
        {scores.map((s) => (
          <li key={s.id}>{s.username}: {s.score}</li>
        ))}
      </ul>
    </div>
  );
}
```

```typescript
// Server component
import { getTopScores } from '@/db/actions/game-actions';

async function LeaderboardServer() {
  const scores = await getTopScores(10);

  return (
    <ul>
      {scores.map((s) => (
        <li key={s.id}>{s.username}: {s.score}</li>
      ))}
    </ul>
  );
}
```

## Common Query Patterns

### ⚠️ CRITICAL: Drizzle Query Syntax

**Drizzle uses FUNCTIONAL syntax, NOT method chaining on columns.**

**❌ WRONG - ActiveRecord/Sequelize/Prisma style (WILL NOT COMPILE):**

```typescript
// These patterns DO NOT WORK in Drizzle:
.where((row) => row.fid.eq(fid))           // ❌ .eq() is not a column method
.where((stats) => stats.fid.equals(fid))   // ❌ .equals() doesn't exist
.where(userStats.fid.eq(fid))              // ❌ Columns don't have .eq()
.where({ fid: fid })                       // ❌ Object syntax doesn't work
```

**✅ CORRECT - Drizzle functional style:**

```typescript
import { eq, and, or, gt, lt, gte, lte, ne, like, isNull, isNotNull } from "drizzle-orm";

// Single condition
.where(eq(tableName.fid, fid))

// Multiple conditions with AND
.where(and(eq(tableName.fid, fid), gt(tableName.score, 100)))

// Multiple conditions with OR
.where(or(eq(tableName.status, 'active'), eq(tableName.status, 'pending')))
```

**Key insight:** In Drizzle, `eq`, `gt`, `lt`, etc. are **imported functions**, not methods on column objects.

---

### Basic Insert

```typescript
await db.insert(tableName).values({ field1: value1, field2: value2 });
```

### Select All

```typescript
const results = await db.select().from(tableName);
```

### Select with Where Clause

```typescript
import { eq } from "drizzle-orm";
const results = await db
  .select()
  .from(tableName)
  .where(eq(tableName.field, value));
```

### Select with Multiple Conditions

```typescript
import { eq, and } from "drizzle-orm";
const results = await db
  .select()
  .from(tableName)
  .where(and(eq(tableName.field1, value1), eq(tableName.field2, value2)));
```

### Select with Order and Limit

```typescript
import { desc } from "drizzle-orm";
const results = await db
  .select()
  .from(tableName)
  .orderBy(desc(tableName.score))
  .limit(10);
```

### Update

```typescript
import { eq } from "drizzle-orm";
await db.update(tableName).set({ field: newValue }).where(eq(tableName.id, id));
```

### Delete

```typescript
import { eq } from "drizzle-orm";
await db.delete(tableName).where(eq(tableName.id, id));
```

### Upsert (Insert or Update)

```typescript
await db
  .insert(tableName)
  .values({ id, field: value })
  .onConflictDoUpdate({
    target: tableName.id,
    set: { field: value },
  });
```

## ⚠️ CRITICAL: Type Safety with Drizzle Results

**Drizzle infers types from your schema, which may not match your app's custom types.**

### The Problem: Schema Types vs App Types

When you define a schema column as `text("category")`, Drizzle infers the type as `string`. But your app might expect a specific union type like `"origins" | "reactions" | "symbols"`.

**❌ WRONG - This causes type errors:**

```typescript
// In schema.ts
export const loreTerms = pgTable("lore_terms", {
  category: text("category").notNull(), // Drizzle type: string
});

// In your app types
type LoreTerm = {
  category: "origins" | "reactions" | "symbols" | "people"; // Specific union
};

// In your component - TYPE ERROR!
const [terms, setTerms] = useState<LoreTerm[]>([]);
const dbTerms = await getLoreTerms(); // Returns { category: string }[]
setTerms(dbTerms); // ❌ Type 'string' is not assignable to type '"origins" | ..."'
```

### Solutions

**Option 1: Define types from schema (RECOMMENDED)**

```typescript
// Let Drizzle infer the type - no mismatch possible
import { loreTerms } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type LoreTerm = InferSelectModel<typeof loreTerms>;

// Now your state matches what the database returns
const [terms, setTerms] = useState<LoreTerm[]>([]);
```

**Option 2: Cast/transform in server action**

```typescript
"use server";

import { db } from "@/neynar-db-sdk/db"; // ✅ CORRECT path
import { loreTerms } from "@/db/schema";

type Category = "origins" | "reactions" | "symbols" | "people";

export async function getLoreTerms(): Promise<LoreTerm[]> {
  const results = await db.select().from(loreTerms);
  // Explicitly cast - you're asserting the data is valid
  return results.map((r) => ({
    ...r,
    category: r.category as Category,
  }));
}
```

**Option 3: Use wider types in your app**

```typescript
// Accept what the database gives you
type LoreTerm = {
  category: string; // Match Drizzle's inferred type
  // ... other fields
};
```

### Nullable Fields: Another Common Mismatch

Schema fields without `.notNull()` are nullable, which affects your types:

```typescript
// Schema: nullable field
shareCount: integer("share_count"), // Type: number | null

// App type expects non-null
type LoreTerm = {
  shareCount: number; // ❌ Mismatch!
};

// Fix: Match the nullability
type LoreTerm = {
  shareCount: number | null; // ✅ Matches schema
};
```

### Quick Reference: Schema → TypeScript Types

| Schema Definition            | TypeScript Type   |
| ---------------------------- | ----------------- |
| `text("col").notNull()`      | `string`          |
| `text("col")`                | `string \| null`  |
| `integer("col").notNull()`   | `number`          |
| `integer("col")`             | `number \| null`  |
| `boolean("col").notNull()`   | `boolean`         |
| `boolean("col")`             | `boolean \| null` |
| `timestamp("col").notNull()` | `Date`            |
| `timestamp("col")`           | `Date \| null`    |

**Rule of thumb:** If your app has strict union types or non-null expectations, either:

1. Use `InferSelectModel` to derive types from schema, OR
2. Transform/cast data in your server actions before returning

---

## Error Handling

Always wrap database operations in try-catch in your server actions:

```typescript
"use server";

import { db } from "@/neynar-db-sdk/db"; // ✅ CORRECT path
import { gameScores } from "@/db/schema";

export async function saveGameScore(fid: number, score: number) {
  try {
    await db.insert(gameScores).values({ fid, score });
    return { success: true };
  } catch (error) {
    console.error("Failed to save score:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

## Schema Migration Workflow

**Every time you add or modify tables:**

1. **Edit** `src/db/schema.ts`
2. **Run** `pnpm run db:push` (pushes changes to database with --force)
   - **NOTE:** This will FAIL on ambiguous changes (see "Handling Schema Push Failures" above)
   - If it fails, revise your schema to be more explicit and non-destructive
3. **Schema updates automatically** (hot reload handles db client updates)
4. **Create server actions** in `src/db/actions/`
5. **Use** in your app components

**Important:**

- Schema changes are applied automatically through hot reload
- `pnpm run db:push` only updates the database, not the running server
- `pnpm run db:push` uses `--force` flag to auto-accept destructive changes
- `pnpm run db:push` **fails fast** on ambiguous changes instead of prompting
- If push fails, make your changes more explicit (add new columns instead of renaming)
- May lose data on conflicting changes (acceptable in development)
- TypeScript types update immediately when you edit schema.ts

</patterns>

<critical-rules>
## Database Usage Rules

**DO**:

- ✅ ALWAYS use server actions for database operations
- ✅ Create server actions in `src/db/actions/`
- ✅ Use KV store for simple string data
- ✅ Run `pnpm run db:push` after schema changes (updates apply automatically)
- ✅ Wrap operations in try-catch
- ✅ Import server actions from `@/db/actions/*` in your components

**DON'T**:

- ❌ Never import `db` directly in components (use server actions instead)
- ❌ Never skip creating server actions for custom tables
- ❌ Never forget to run `pnpm run db:push` after schema changes
- ❌ Never skip error handling
- ❌ Never use for data that should be fetched via API hooks
- ❌ Never skip running `pnpm run db:push` after schema changes

## When to Use Database vs API Hooks

**Use Database (Server Actions) when:**

- Storing user-generated data
- Persisting app state
- Custom tables specific to your app
- Data that doesn't come from Neynar API

**Use API Hooks when:**

- Fetching Farcaster data (users, casts, channels)
- Fetching crypto prices
- Any data from Neynar or CoinGecko APIs
- Real-time social data

**Example**: Store game scores in database (server actions), fetch user profiles via API hooks

## Admin Views for Data Access

**CRITICAL**: You cannot display database contents directly to the user in chat. All data must be viewed **through the app itself**.

When users ask to "see my data" or "show analytics", build them an **FID-protected admin view**:

```typescript
// Example: Admin page at /admin
"use client";
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";

function AdminPage() {
  const { data: user } = useFarcasterUser();
  const creatorFid = parseInt(process.env.NEXT_PUBLIC_USER_FID || "0");

  if (user?.fid !== creatorFid) {
    return <div>Access denied. Admin only.</div>;
  }

  // Show admin analytics/data here
  return <AdminDashboard />;
}
```

**Key points**:

- `process.env.NEXT_PUBLIC_USER_FID` contains the app creator's FID
- Compare against `user.fid` from `useFarcasterUser()` to restrict access
- Build leaderboards, analytics dashboards, or data export features in the app

## ⛔ NEVER Skip Database Implementation

**CRITICAL: If you've determined data storage is needed, you MUST implement it. DO NOT:**

❌ **Skip database setup** thinking "user can add it later"
❌ **Use placeholder/mock data** instead of real database
❌ **Store only in React state** when data needs to persist
❌ **Use localStorage** for any production persistence (it's only for Phase 1 wireframes)
❌ **Implement UI first** and "plan to add database later"

**The correct approach:**

✅ **Evaluate data needs FIRST** (before building UI)
✅ **Set up database schema IMMEDIATELY** if needed
✅ **Run `pnpm run db:push`** to create tables
✅ **Create server actions** for all data operations
✅ **Then build UI** that calls the server actions

**Example - WRONG approach:**

```typescript
// ❌ BAD: Building game with state-only scores
const [score, setScore] = useState(0);
// Score is lost on page refresh, can't be shared, no leaderboard possible
```

**Example - CORRECT approach:**

```typescript
// ✅ GOOD: Set up database first
// 1. Added gameScores table to schema.ts
// 2. Ran pnpm run db:push
// 3. Created server action in src/db/actions/game-actions.ts
"use server";
import { db } from "@/neynar-db-sdk/db"; // ✅ CORRECT - the ONLY valid path
import { gameScores } from "@/db/schema";
export async function saveScore(fid: number, score: number, username: string) {
  await db.insert(gameScores).values({ fid, score, username });
}
// 4. Now build UI that calls saveScore()
```

**Remember: Database setup takes 3 simple steps. Rebuilding an app later to add persistence takes 10x longer.**
</critical-rules>

<checklist>
## Database Implementation Checklist

**BEFORE writing ANY code:**

- [ ] **Evaluated user request**: Does it require data persistence? (Use decision tree above)
- [ ] **Determined storage type**: KV store (simple) vs Custom tables (queryable)? (NOT localStorage - that's only for Phase 1 wireframes)
- [ ] **Planned data model**: Asked clarifying questions, proposed in plain English, got confirmation

**IF using KV Store (simple key-value):**

- [ ] **Can use immediately**: No schema setup needed
- [ ] **Use server actions**: Import kvGet, kvSet, kvDelete from '@/neynar-db-sdk'
- [ ] **Test**: Verify operations work before building UI

**IF using Custom Tables (queryable data):**

- [ ] **STEP 1 - Schema**: Edited `src/db/schema.ts` to add table(s)
- [ ] **STEP 2 - Push**: Ran `pnpm run db:push` IMMEDIATELY after schema edit
- [ ] **STEP 3 - Verify**: Schema changes applied and hot reload working
- [ ] **STEP 4 - Server Actions**: Created file in `src/db/actions/` (e.g., `game-actions.ts`)
- [ ] **STEP 5 - Test**: Verified server actions work before building UI

**FOR all database implementations:**

- [ ] **Server actions only**: All database operations use server actions
- [ ] **Error handling**: Wrapped all operations in try-catch
- [ ] **Data vs API**: Confirmed not using database for data available via API hooks
- [ ] **🚨 CORRECT db IMPORT**: Used `import { db } from '@/neynar-db-sdk/db'` (NOT `@/db` or `@/neynar-db-sdk`)
- [ ] **Correct schema import**: Used `import { myTable } from '@/db/schema'`
- [ ] **Backwards compatible**: Schema changes are additive only (no deletes, renames, or type changes)

**NEVER:**

- [ ] ❌ Skip database setup even if it seems optional
- [ ] ❌ Use React state for data that needs to persist
- [ ] ❌ Build UI before setting up database schema
- [ ] ❌ Forget to run `pnpm run db:push` after schema changes
- [ ] ❌ **Import `db` from `@/db`** - this path doesn't exist!
- [ ] ❌ **Import `db` from `@/neynar-db-sdk`** - causes bundler errors!
- [ ] ❌ Create server actions in `src/neynar-db-sdk/` - use `src/db/actions/`!
- [ ] ❌ Delete, rename, or modify existing columns/tables (breaks backwards compatibility)
      </checklist>

---

**Note**: The `DATABASE_URL` environment variable is set after database provisioning (see Step 0). You must provision the database via `mcp__neynar-app-studio__provision_database` before using any database features.
