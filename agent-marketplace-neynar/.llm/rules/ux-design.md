# UX Design Standards

Universal UX patterns for Farcaster mini app development. This file applies to all phases where visual design decisions are made.

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

---

## 🚨 CRITICAL: Mobile-First Design

Farcaster mini apps run in a **fixed 424x695px mobile viewport**. Every design decision must account for this constraint.

**Viewport Rules:**

- Maximum 2 columns in any grid layout
- No horizontal scrolling (except intentional carousels)
- Vertical stacking is the default
- Touch targets minimum 44px height
- Truncate long text with `truncate` class

---

## 🚨 CRITICAL: Spacing & Visual Polish

**Cramped layouts are NEVER acceptable.** Beautiful spacing is mandatory, not optional.

### Container & Card Spacing (MANDATORY)

- ❌ **NEVER** let cards/content touch container edges
- ✅ **ALWAYS** add padding to scrollable content areas: `p-4` minimum
- ✅ **ALWAYS** add gaps between stacked cards: `space-y-4` or `gap-4`
- ✅ Cards should have internal padding: `p-4` or use `CardContent` with padding
- ✅ Lists of items need breathing room between them

### Example - WRONG (cramped)

```tsx
<main className="flex-1 overflow-y-auto">
  <Card>...</Card> {/* Card touches edges - BAD */}
  <Card>...</Card> {/* No gap between cards - BAD */}
</main>
```

### Example - CORRECT (breathing room)

```tsx
<main className="flex-1 overflow-y-auto p-4">
  <div className="space-y-4">
    <Card>...</Card> {/* Has margin from edges */}
    <Card>...</Card> {/* Has gap above */}
  </div>
</main>
```

---

## Visual Hierarchy

Design should guide the eye naturally through content.

### Typography Scale

```tsx
// Headers - use @neynar/ui components
<H1>Page Title</H1>        // Largest, rarely used
<H2>Section Header</H2>    // Major sections
<H3>Card Title</H3>        // Card headers, subsections
<H4>Label</H4>             // Small headers

// Body text
<P>Main content text</P>
<Small>Secondary/meta info</Small>

// Emphasis
<span className="text-muted-foreground">De-emphasized</span>
```

### Spacing Scale

Use Tailwind's spacing scale consistently:

| Size | Class           | Use Case                           |
| ---- | --------------- | ---------------------------------- |
| 1    | `gap-1`, `p-1`  | Tight groupings (icons + text)     |
| 2    | `gap-2`, `p-2`  | Related items (button content)     |
| 4    | `gap-4`, `p-4`  | Standard spacing (cards, sections) |
| 6    | `gap-6`, `p-6`  | Major sections                     |
| 8    | `gap-8`, `my-8` | Page-level separation              |

---

## Layout Architecture

### 🚨 CRITICAL: Choose Layout First

Before building any content, decide your layout type. This is the most important structural decision.

### Layout Decision Tree

**Question: Is this a scrolling content app or a viewport-filling app?**

| App Type              | Layout Choice            | Use When                                            |
| --------------------- | ------------------------ | --------------------------------------------------- |
| **Scrolling Content** | `StandardMiniLayout`     | Feeds, lists, articles, settings, long-form content |
| **Viewport-Filling**  | Custom `h-dvh` layout    | Games, dashboards, calculators, interactive tools   |
| **Multi-Section**     | Custom `h-dvh` with tabs | Apps needing navigation between distinct sections   |

### 🚫 DEPRECATED: GameMiniLayout

**Do NOT use `GameMiniLayout`** - it has issues and is being phased out.

For games and viewport-filling apps, use the **custom `h-dvh` pattern** shown in "Layout Patterns" below instead. This gives you full control over the layout structure.

### Layout Modes (Wireframe → Production)

| Phase 1 (Sketch)                 | Phase 2+ (Real)          | Description                       |
| -------------------------------- | ------------------------ | --------------------------------- |
| `SketchMiniLayout mode="scroll"` | `StandardMiniLayout`     | Fixed header, scrollable content  |
| `SketchMiniLayout mode="fixed"`  | Custom `h-dvh` layout    | Full viewport, no body scroll     |
| `SketchMiniLayout mode="tabs"`   | Custom `h-dvh` with tabs | Full viewport with tab navigation |

---

## Layout Patterns

### Scrolling Content Apps (feeds, lists)

Use when: Social feeds, article readers, settings pages, any content that scrolls.

```tsx
import { StandardMiniLayout } from "@/neynar-farcaster-sdk/mini";

export function MiniApp() {
  return (
    <StandardMiniLayout>
      <div className="p-4 space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">...</CardContent>
          </Card>
        ))}
      </div>
    </StandardMiniLayout>
  );
}
```

**Key characteristics:**

- Fixed floating header with backdrop blur
- Main content scrolls naturally
- Content padding handled inside, not on layout

### Viewport-Filling Apps (games, dashboards)

Use when: Games, calculators, visualizations, dashboards, interactive tools.

**CRITICAL PATTERN**: The `h-dvh` flex column layout.

```tsx
export function MiniApp() {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Fixed header - shrink-0 prevents compression */}
      <header className="shrink-0 p-4 border-b">
        <H3>App Name</H3>
      </header>

      {/* Scrollable main - flex-1 fills remaining space */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">{/* Content here */}</div>
      </main>

      {/* Fixed footer - shrink-0 prevents compression */}
      <footer className="shrink-0 p-4 border-t">
        <Button className="w-full">Action</Button>
      </footer>
    </div>
  );
}
```

**Why this pattern works:**

| Class             | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| `h-dvh`           | Full viewport height (dynamic viewport height for mobile) |
| `flex flex-col`   | Stack children vertically                                 |
| `overflow-hidden` | Prevent body scroll, contain scroll within sections       |
| `shrink-0`        | Prevent header/footer from shrinking                      |
| `flex-1`          | Main area fills remaining space                           |
| `overflow-y-auto` | Enable scrolling within main area only                    |

**Common mistake**: Forgetting `overflow-hidden` on the outer container, causing double scrollbars.

### Tabbed Apps (multi-section)

Use when: Apps with distinct sections (Play/Stats/Settings, Home/Profile/Settings).

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@neynar/ui";

export function MiniApp() {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Fixed header */}
      <header className="shrink-0 p-4 border-b">
        <H3>My App</H3>
      </header>

      {/* Tab navigation fills remaining space */}
      <Tabs defaultValue="play" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 w-full justify-start border-b rounded-none">
          <TabsTrigger value="play">Play</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Tab content - each fills available space */}
        <TabsContent value="play" className="flex-1 overflow-y-auto p-4 mt-0">
          <PlayTab />
        </TabsContent>
        <TabsContent value="stats" className="flex-1 overflow-y-auto p-4 mt-0">
          <StatsTab />
        </TabsContent>
        <TabsContent
          value="settings"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Key characteristics:**

- Full viewport height with `h-dvh`
- Static header with app title
- Tab bar for navigation using `@neynar/ui` Tabs
- Each tab's content scrolls independently within `flex-1 overflow-y-auto`
- `min-h-0` on Tabs container prevents flex children from overflowing

---

## Touch Targets & Accessibility

### Minimum Touch Target Size

```tsx
// ✅ CORRECT - Large enough for fingers
<Button className="h-12 px-6">Tap Me</Button>

// ❌ WRONG - Too small
<Button className="h-6 px-2">Tap Me</Button>
```

**Minimum sizes:**

- Buttons: 44px height minimum
- List items: 48px height for tappable rows
- Icon buttons: 44x44px minimum hit area

### Focus States

```tsx
// Buttons automatically have focus states from @neynar/ui
// For custom interactive elements:
<div
  className="focus:ring-2 focus:ring-primary focus:outline-none rounded-lg"
  tabIndex={0}
  role="button"
>
  Custom interactive element
</div>
```

---

## States & Feedback

### Loading States

```tsx
import { Skeleton } from "@neynar/ui";

// Card skeleton
<Card>
  <CardContent className="p-4 space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </CardContent>
</Card>

// Full page loading
<div className="h-dvh flex items-center justify-center">
  <Spinner />
</div>
```

### Empty States

```tsx
// ✅ CORRECT - Intentional, helpful
<div className="flex flex-col items-center justify-center p-8 text-center">
  <div className="text-4xl mb-4">📭</div>
  <H4>No items yet</H4>
  <P className="text-muted-foreground">Start by adding your first item</P>
  <Button className="mt-4">Add Item</Button>
</div>

// ❌ WRONG - Just empty space
<div>{items.length === 0 && null}</div>
```

### Error States

```tsx
<Card className="border-destructive">
  <CardContent className="p-4">
    <div className="flex items-center gap-2 text-destructive">
      <AlertCircle className="h-5 w-5" />
      <P>Something went wrong. Please try again.</P>
    </div>
    <Button variant="outline" className="mt-3" onClick={retry}>
      Retry
    </Button>
  </CardContent>
</Card>
```

---

## Transitions & Polish

### Smooth Transitions

```tsx
// Color/opacity transitions
<div className="transition-colors hover:bg-muted">...</div>
<div className="transition-opacity opacity-50 hover:opacity-100">...</div>

// Transform transitions (for interactive feedback)
<Button className="transition-transform active:scale-95">Tap Me</Button>
```

### Animation Principles

- Keep animations subtle and fast (150-300ms)
- Use `transition-colors` for hover states
- Use `transition-opacity` for appearing/disappearing
- Avoid excessive motion - respect `prefers-reduced-motion`

---

## Visual Polish Checklist

Before completing any phase that involves UI:

- [ ] **No content touching container edges** - all scrollable areas have `p-4` padding
- [ ] **Consistent gaps between cards/sections** - using `space-y-4` or `gap-4`
- [ ] **Cards have internal padding** - content not cramped inside cards
- [ ] **Visual hierarchy is clear** - headers stand out, body text readable
- [ ] **Buttons are tappable** - minimum 44px touch targets
- [ ] **Empty states look intentional** - not broken or missing
- [ ] **Loading states use Skeleton components**
- [ ] **Transitions feel smooth** - `transition-colors`, `transition-opacity`
- [ ] **App looks polished and professional** - not like a rough prototype

---

## Common Anti-Patterns

### ❌ DON'T: Cramped Cards

```tsx
// BAD - no padding anywhere
<main className="overflow-y-auto">
  <Card>
    <CardContent>Content</CardContent>
  </Card>
</main>
```

### ✅ DO: Breathing Room

```tsx
// GOOD - proper spacing
<main className="overflow-y-auto p-4">
  <Card>
    <CardContent className="p-4">Content</CardContent>
  </Card>
</main>
```

### ❌ DON'T: Tiny Touch Targets

```tsx
// BAD - too small to tap
<button className="p-1 text-xs">X</button>
```

### ✅ DO: Generous Touch Areas

```tsx
// GOOD - easy to tap
<Button size="icon" className="h-10 w-10">
  <X className="h-4 w-4" />
</Button>
```

### ❌ DON'T: Missing States

```tsx
// BAD - user sees nothing during load
{
  isLoading ? null : <Content />;
}
```

### ✅ DO: Helpful Feedback

```tsx
// GOOD - user knows what's happening
{
  isLoading ? <LoadingSkeleton /> : <Content />;
}
```
