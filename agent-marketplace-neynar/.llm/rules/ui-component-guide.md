# UI Component Guide

## Prerequisites

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

Complete guide for discovering and using @neynar/ui components in Farcaster mini apps.

---

## Overview

The @neynar/ui package contains 265+ pre-built components. **Always search the package first before building custom components.**

---

## Component Discovery Process

### Step 1: Read Main Documentation

**Start here**: `node_modules/@neynar/ui/llms.txt`

This file contains:

- Overview of the component library
- How components are organized
- General usage patterns
- Links to component categories

### Step 2: Search the Component Catalog

**Component registry**: `node_modules/@neynar/ui/.llm/sdk-items-registry.json`

This JSON file contains the complete catalog with:

- All 265+ component names
- Component categories/types
- Brief descriptions
- File paths to detailed documentation

**Search strategy**:

1. Identify categories that match requirements (e.g., "layout", "typography", "forms")
2. Look for components by name keywords (e.g., "button", "card", "input")
3. Check descriptions for functionality matches
4. Note the file path for each matching component

### Step 3: Read Specific Component Documentation

**For each component you'll use**, read its detailed documentation:

**Path pattern**: `node_modules/@neynar/ui/.llm/[component-name].llm.md`

Each .llm.md file contains:

- Component API (props, variants, sizes)
- Usage examples
- TypeScript interfaces
- Common patterns
- Mobile considerations
- Integration examples

**What to extract**:

- Component name and import path
- Key props and variants
- Usage patterns
- Any special requirements or constraints
- Mobile/responsive considerations

---

## Essential Best Practices

### 1. Always Import from @neynar/ui (Main Package Only!)

**🚨 CRITICAL - NO SUBPACKAGE IMPORTS:**

```typescript
// ✅ CORRECT - Import from main package
import { H3, P, Button, Card, cn } from "@neynar/ui";
import { Dialog, DialogContent, DialogHeader } from "@neynar/ui";

// ❌ WRONG - Subpackage imports DON'T EXIST
import { Dialog } from "@neynar/ui/dialog";
import { Button } from "@neynar/ui/button";
import { Card } from "@neynar/ui/card";

// ❌ WRONG - cn does NOT exist at @/lib/utils
import { cn } from "@/lib/utils";
```

**ALL @neynar/ui components and utilities are exported from the main package.** There are NO subpackage exports. The `cn` utility for className merging comes from `@neynar/ui`, NOT from `@/lib/utils`.

```typescript
// ✅ CORRECT - Use @neynar/ui components
import { H3, P, Button, Card } from '@neynar/ui';

<H3>Section Title</H3>
<P>Body content</P>
<Button variant="default">Submit</Button>

// ❌ WRONG - Raw HTML
<h3>Section Title</h3>
<p>Body content</p>
<button>Submit</button>
```

**Why**: Raw HTML doesn't respect theming, accessibility, or mobile optimizations.

---

### 2. Button Variants (CRITICAL)

```typescript
// ✅ CORRECT - Primary button
<Button variant="default">Primary Action</Button>

// ❌ WRONG - "primary" doesn't exist
<Button variant="primary">Primary Action</Button>
```

**Available variants**:

- `"default"` - Primary button (filled, prominent)
- `"secondary"` - Secondary action
- `"outline"` - Outlined button
- `"ghost"` - Minimal button
- `"link"` - Link-styled button
- `"destructive"` - Danger/delete actions

---

### 3. Stack Spacing MUST Be Numeric

```typescript
// ✅ CORRECT
<Stack direction="vertical" spacing={4}>
<Stack direction="horizontal" spacing={6}>

// ❌ WRONG - String spacing doesn't work
<Stack direction="vertical" spacing="md">
<Stack direction="horizontal" spacing="lg">
```

**Common spacing values**: 2, 3, 4, 6, 8 (Tailwind scale)

---

### 4. Mobile-First Typography

Use appropriate heading sizes for mobile (424px width):

```typescript
// ✅ CORRECT - Mobile-optimized hierarchy
<H3>Section Header</H3>      // Most common
<H4>Subsection</H4>           // Within cards
<P>Body text</P>              // Paragraphs
<Small color="muted">Meta</Small>  // Captions, timestamps

// ❌ WRONG - Too large for mobile
<H1>Section Header</H1>       // Only for page title
<H2>Subsection</H2>           // Too large for sections
```

**Typography hierarchy**:

- `H1` - Page title only (rarely used - app name usually in header)
- `H2` - Major page sections (use sparingly)
- `H3` - Section headers, card titles (MOST COMMON)
- `H4` - Subsections within cards
- `P` - Body text
- `Small` - Meta information, captions, timestamps

---

### 5. Maximum 2 Columns on Mobile

```typescript
// ✅ CORRECT - Mobile-friendly
<div className="grid grid-cols-2 gap-4">

// ❌ WRONG - Too cramped on 424px
<div className="grid grid-cols-3 gap-2">
<div className="grid grid-cols-4 gap-2">
```

**CRITICAL**: Mobile viewport is 424px wide. Never exceed `grid-cols-2`.

---

### 6. Card Structure

```typescript
// ✅ CORRECT - Semantic card structure
import { Card, CardHeader, CardTitle, CardContent } from '@neynar/ui';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <P>Content goes here</P>
  </CardContent>
</Card>

// ❌ WRONG - Custom div structure
<div className="border rounded p-4">
  <h3>Title</h3>
  <p>Content</p>
</div>
```

---

### 7. Color Props for Typography

```typescript
<P color="default">Normal text</P>
<P color="muted">Secondary text</P>
<P color="destructive">Error text</P>

<Small color="muted">Timestamp: {timestamp}</Small>
```

**Available colors**: `"default"`, `"muted"`, `"destructive"`, `"primary"`

---

## Common Component Patterns

### Stats Card

```typescript
import { Card, CardContent, H3, Small } from '@neynar/ui';

<Card>
  <CardContent className="p-4 text-center">
    <H3>1,234</H3>
    <Small color="muted">Total Users</Small>
  </CardContent>
</Card>
```

### Section with Header

```typescript
import { Stack, H3, P } from '@neynar/ui';

<Stack direction="vertical" spacing={4}>
  <H3>Section Title</H3>
  <P>Section content</P>
</Stack>
```

### Loading State

```typescript
import { Skeleton } from '@neynar/ui';

{isLoading ? (
  <Skeleton className="h-6 w-48" />
) : (
  <P>{data}</P>
)}
```

### Empty State

```typescript
import { EmptyState, Button } from '@neynar/ui';

<EmptyState
  title="No items found"
  description="Try adjusting your filters"
  action={<Button variant="outline">Reset</Button>}
/>
```

### Form Pattern

```typescript
import { Stack, Label, Input, Button } from '@neynar/ui';

<Stack direction="vertical" spacing={4}>
  <div>
    <Label htmlFor="name">Name</Label>
    <Input id="name" name="name" />
  </div>
  <Button variant="default">Submit</Button>
</Stack>
```

---

## Component Categories

### Layout

- `Container` - Page container with max-width
- `Stack` - Flexbox container with spacing
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`

### Typography

- `H1`, `H2`, `H3`, `H4`, `H5`, `H6`
- `P`, `Small`, `Code`

### Interactive

- `Button` - All button variants
- `Input`, `Textarea` - Form inputs
- `Label` - Form labels
- `Select` - Dropdown select

### Feedback

- `Badge` - Status indicators, tags
- `Skeleton` - Loading placeholders
- `EmptyState` - No data states
- `Alert` - Alert messages
- `Toaster` - Toast notification container (place once in providers)
- `toast` - Toast notification function (`.success()`, `.error()`, `.info()`, `.warning()`, `.loading()`, `.promise()`)

### Navigation

- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

---

## Finding Components

**When you need a component**:

1. **Check common components** (listed above) - covers 90% of needs
2. **Search the catalog**: `node_modules/@neynar/ui/.llm/sdk-items-registry.json`
3. **Read specific docs**: `node_modules/@neynar/ui/.llm/[component-name].llm.md`

**For complex UI discovery** (finding multiple components for a feature):

- Use Glob to search: `node_modules/@neynar/ui/.llm/*.llm.md`
- Use Grep to find by keyword: search for "table", "form", "navigation", etc.
- Read llms.txt for category overview

---

## Mobile Considerations

**CRITICAL for 424px viewport**:

- Max 2 columns (`grid-cols-2`)
- Vertical layouts preferred (`Stack direction="vertical"`)
- Truncate text (`className="truncate"`)
- Use `min-w-0` with flex for truncation to work
- H3 for section headers (H1/H2 too large)
- Adequate spacing between interactive elements

---

## Common Mistakes

### ❌ Wrong: Subpackage Imports (CRITICAL)

```typescript
import { Dialog } from "@neynar/ui/dialog";
import { Button } from "@neynar/ui/button";
```

**Fix**: `import { Dialog, Button } from "@neynar/ui"` (main package only!)

### ❌ Wrong: Using Raw HTML

```typescript
<h3 className="text-lg font-bold">Title</h3>
```

**Fix**: Use `<H3>Title</H3>`

### ❌ Wrong: Primary Button Variant

```typescript
<Button variant="primary">Submit</Button>
```

**Fix**: Use `<Button variant="default">Submit</Button>`

### ❌ Wrong: String Spacing

```typescript
<Stack spacing="lg">
```

**Fix**: Use `<Stack spacing={6}>`

### ❌ Wrong: Too Many Columns

```typescript
<div className="grid grid-cols-4">
```

**Fix**: Use `<div className="grid grid-cols-2">` (max)

### ❌ Wrong: Wrong Typography Hierarchy

```typescript
<H2>Card Title</H2>  // Too large
```

**Fix**: Use `<H3>Card Title</H3>`

### ❌ Wrong: Importing Toast from Sonner Directly

```typescript
import { toast } from "sonner";
import { Toaster } from "sonner";
```

**Fix**: `import { toast, Toaster } from "@neynar/ui"` (sonner is bundled in @neynar/ui with theme integration — never import it directly)

---

## When to Load This File

Load ui-best-practices.md when:

- Building UI components
- Getting component-related errors
- Need to verify correct component usage
- Unsure which component to use
- Need mobile optimization guidance
