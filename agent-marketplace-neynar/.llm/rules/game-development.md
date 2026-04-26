# Neynar Farcaster Mini App Template - Game Development Rules

**CRITICAL**: This file contains essential rules for game development in Farcaster mini apps. Load this file whenever the user requests any game-related functionality.

## Prerequisites

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

**REQUIRED COMPANION FILE**: All games require audio. You MUST also load [audio-system.md](./audio-system.md) alongside this file for complete audio implementation guidance (sound effects and background music are mandatory for games).

## 📍 Game SDK Documentation (PRIMARY REFERENCE)

**For implementing game features, ALWAYS refer to the Game SDK catalog first:**

**Primary Source**: `src/neynar-farcaster-sdk/src/mini/features/game/llms.txt`

The Game SDK provides 40+ APIs across 10 feature categories:

### Core Systems

- **Initialization**: useInitializeGame, useGameLoop (frame-based animation, 60 FPS)
- **State Management**: Global atoms for pause, game over, loading, controls

### Gameplay Mechanics

- **Scoring**: useScore, useCombo, useStreak (points, multipliers, consecutive wins)
- **Timers**: useCountdown, useStopwatch (pause-aware, millisecond precision)
- **Persistence**: useLocalStorageState, useCheckpoint (save systems)

### Polish & Effects (Wave 2)

- **Visual Effects**: useScreenShake, useParticles, useFlashEffect, usePulse, useScorePopup
- **Tutorials**: useTutorial, TutorialOverlay, ControlsHelper (onboarding systems)
- **Power-ups**: usePowerUps, useInventory, useBuffs (temporary abilities, stat modifiers)

### UI & Utilities

- **Components**: GameBoard, DirectionalPad, ActionButtons, displays
- **Math**: clamp, lerp, distance, angle conversions
- **Random**: randomInt, randomChoice, shuffle, weightedRandom

**🚫 DEPRECATED**: `GameMiniLayout` is deprecated. Use custom `h-dvh` layouts with tabs from `@neynar/ui` instead (see ux-design.md).

**For LLMs - Discovery Flow**:

1. Check SDK llms.txt catalog for available APIs
2. Read implementation guides in SDK `.llm/guides/` folder
3. Reference auto-generated API docs in SDK `.llm/api-reference/`
4. Return to this file for template-specific architecture rules

**This file focuses on template-level patterns (file organization, architecture). SDK documentation covers API usage.**

---

## 🏗️ Game Architecture: Feature-Based Organization (MANDATORY)

**CRITICAL**: ALL games MUST follow the feature-based architecture pattern. The `src/app/` directory is OFF-LIMITS for development - all game code goes in `src/features/`.

### Architecture Pattern

```
src/
├── app/                              # PROTECTED - READ-ONLY
│   └── page.tsx                      # Minimal wrapper - just imports App
├── features/                         # YOUR DEVELOPMENT AREA
│   ├── app.tsx                       # Main app component (replaces page.tsx content)
│   ├── game/                         # Game feature module
│   │   ├── tabs/                     # Tab components
│   │   │   ├── play-tab.tsx          # Play tab with GameBoard
│   │   │   ├── leaderboard-tab.tsx   # Leaderboard display
│   │   │   └── settings-tab.tsx      # Settings/controls
│   │   ├── types.ts                  # Game types AND constants
│   │   ├── utilities.ts              # Game logic utilities
│   │   └── actions.ts                # Server actions (database, etc.)
│   └── audio/                        # Audio feature module
│       ├── theme-song.ts             # Background music
│       └── custom-sfx.ts             # Custom sound effects
└── components/                       # Shared components (if needed)
```

### Implementation Pattern

**Step 1: Create features/app/mini-app.tsx (Main App Component - LLM Entry Point)**

⚠️ **CRITICAL**: This is `src/features/app/mini-app.tsx` (exports `MiniApp` component), NOT a barrel file pattern.

This is where your actual application logic lives. The `src/app/page.tsx` is just a minimal wrapper that imports this.

**🚫 DEPRECATED**: `GameMiniLayout` is deprecated. Use custom `h-dvh` layouts with tabs from `@neynar/ui` instead.

```tsx
// src/features/app/mini-app.tsx - Main app component (LLM entry point)
import { useSong } from "@/neynar-farcaster-sdk/audio";
import { Tabs, TabsList, TabsTrigger, TabsContent, H3 } from "@neynar/ui";
import { useEffect } from "react";
import { themeSong } from "@/features/audio/theme-song";
import { PlayTab } from "@/features/game/tabs/play-tab";
import { LeaderboardTab } from "@/features/game/tabs/leaderboard-tab";
import { SettingsTab } from "@/features/game/tabs/settings-tab";

export function MiniApp() {
  const songPlayer = useSong();

  useEffect(() => {
    songPlayer.play(themeSong);
  }, [songPlayer]);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <header className="shrink-0 p-4 border-b">
        <H3>My Game</H3>
      </header>
      <Tabs defaultValue="play" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 w-full justify-start border-b rounded-none">
          <TabsTrigger value="play">Play</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="play" className="flex-1 overflow-hidden mt-0">
          <PlayTab />
        </TabsContent>
        <TabsContent
          value="leaderboard"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          <LeaderboardTab />
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

**Step 2: Create Tab Components**

Each tab is a separate component in `features/game/tabs/`:

```tsx
// features/game/tabs/play-tab.tsx - Play tab with game logic
import { useState } from "react";
import {
  GameBoard,
  ActionButtons,
  useGameActionHandlers,
  useActiveGameActions,
  useSetGameControlsEnabled,
  useInitializeGame,
} from "@/neynar-farcaster-sdk/game";
import { useSfx, MuteButton } from "@/neynar-farcaster-sdk/audio";
import { Card } from "@neynar/ui";
import { getRandomCard } from "@/features/game/utilities";
import { saveGameResult } from "@/features/game/actions";

export function PlayTab() {
  const sfxPlayer = useSfx();
  const setControlsEnabled = useSetGameControlsEnabled();
  const handlers = useGameActionHandlers();
  const activeKeys = useActiveGameActions();

  const [gameState, setGameState] = useState(/* ... */);

  const handleAction = () => {
    // Game logic here
  };

  useInitializeGame({
    config: {
      allowNegativeScore: false, // Set game config
    },
    actions: {
      action: handleAction,
    },
    debounceMs: 300,
  });

  return (
    <GameBoard
      controls={
        <div className="flex items-center justify-between w-full gap-4 px-4">
          <MuteButton />
          <ActionButtons
            onAction={handlers.action}
            actionLabel="Draw Card"
            activeKeys={activeKeys}
          />
        </div>
      }
    >
      {/* Game UI goes here */}
    </GameBoard>
  );
}
```

**Step 3: Organize Supporting Files**

```tsx
// features/game/types.ts - Game types AND constants
export type CardValue = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type CardSuit = "♥" | "♦" | "♣" | "♠";

export type PlayingCard = {
  suit: CardSuit;
  value: CardValue;
  displayValue: string;
};

// Game constants
export const CARD_VALUES: CardValue[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
];
export const CARD_SUITS: CardSuit[] = ["♠", "♥", "♦", "♣"];
```

```tsx
// features/game/utilities.ts - Game logic utilities
import { CARD_VALUES, CARD_SUITS, type PlayingCard } from "./types";

export function getRandomCard(): PlayingCard {
  const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
  const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
  // Game logic implementation
}
```

```tsx
// features/game/actions.ts - Server actions
"use server";

import { saveGameResultToDb } from "@/neynar-db-sdk";

export async function saveGameResult(
  fid: number,
  username: string,
  won: boolean,
  score: number,
) {
  return saveGameResultToDb({ fid, username, won, score });
}
```

### Why This Architecture?

**Benefits:**

1. **Clean separation**: Game logic separate from Next.js routing
2. **Better organization**: Related code grouped by feature
3. **Easier testing**: Feature modules are self-contained
4. **Scalability**: Easy to add new features without touching app/
5. **Protected core**: Next.js app directory remains untouched

**Rules:**

- ✅ ALL game code goes in `src/features/`
- ✅ `src/app/page.tsx` stays minimal (just imports `MiniApp` from `@/features/app/mini-app`)
- ✅ Main app logic lives in `src/features/app/mini-app.tsx` (exports `MiniApp` component - **LLM entry point**)
- ✅ Each tab is a separate component in `features/game/tabs/`
- ✅ Supporting code (types, utilities, actions) in feature directories
- ❌ NEVER read or modify files in `src/app/` - they're just Next.js routing infrastructure
- ❌ NEVER put game logic directly in page.tsx
- ❌ NEVER create barrel files (index.tsx) - use explicit named files

## 🎮 Game Development Core Principles

### Mobile-First Game Design

All games MUST be designed for mobile devices as the primary platform. Many users will access Farcaster mini apps on mobile devices.

## 📱 Mobile Control Requirements

### Rule 1: Dual Input Controls are MANDATORY

**CRITICAL**: Games MUST support BOTH touch controls AND keyboard navigation. All controls must work with both input methods.

**WHY**:

- Mobile users need on-screen touch controls (many access mini apps on phones)
- Desktop users expect keyboard navigation (feels more natural and responsive)
- Great games feel good on ANY device

**RECOMMENDED APPROACH**: Use the pre-built game control components from the SDK!

```tsx
import {
  GameBoard,
  DirectionalPad,
  ActionButtons,
  useInitializeGame,
  useGameActionHandlers,
  useActiveGameActions,
} from "@/neynar-farcaster-sdk/game";
import { Tabs, TabsList, TabsTrigger, TabsContent, H3 } from "@neynar/ui";
import { RotateCw, Zap } from "lucide-react"; // Optional: Use icons for buttons

// 1. Set up game controls - automatically handles both touch AND keyboard
useInitializeGame({
  actions: {
    left: { handler: () => movePlayer("left"), allowRepeat: true },
    right: { handler: () => movePlayer("right"), allowRepeat: true },
    up: { handler: () => movePlayer("up"), allowRepeat: true },
    down: { handler: () => movePlayer("down"), allowRepeat: true },
    action: { handler: () => performAction() },
    action2: { handler: () => performSecondaryAction() },
  },
});

// 2. Get handlers for components
const handlers = useGameActionHandlers();
const activeKeys = useActiveGameActions();

// 3. Create game layout with tabs (using custom h-dvh pattern)
<div className="h-dvh flex flex-col overflow-hidden">
  <header className="shrink-0 p-4 border-b">
    <H3>My Game</H3>
  </header>
  <Tabs defaultValue="play" className="flex-1 flex flex-col min-h-0">
    <TabsList className="shrink-0 w-full justify-start border-b rounded-none">
      <TabsTrigger value="play">Play</TabsTrigger>
      <TabsTrigger value="stats">Stats</TabsTrigger>
    </TabsList>
    <TabsContent value="play" className="flex-1 overflow-hidden mt-0">
      <GameBoard
        controls={
          <div className="flex items-center gap-4">
            <MuteButton />
            <DirectionalPad
              onLeft={handlers.left}
              onRight={handlers.right}
              onUp={handlers.up}
              onDown={handlers.down}
              layout="full"
            />
            <ActionButtons
                onAction={handlers.action}
                onAction2={handlers.action2}
                actionLabel={<RotateCw className="w-4 h-4" />} // Icons supported!
                action2Label={<Zap className="w-4 h-4" />}
                activeKeys={activeKeys} // Visual feedback for active buttons
              />
            </div>
          }
        >
          <canvas ref={canvasRef} width={400} height={600} />
        </GameBoard>
      </TabsContent>
      <TabsContent value="stats" className="flex-1 overflow-y-auto p-4 mt-0">
        <YourStatsComponent />
      </TabsContent>
    </Tabs>
  </div>
</div>;
```

**Available Control System**:

- **`useInitializeGame`** - Hook that registers action handlers and auto-sets up keyboard listeners
  - Register actions: left, right, up, down, action, action2, jump, pause, select
  - Default keys: Arrow keys + WASD, Enter/E, Shift/Q, Space, Escape
  - Customize keys per action with `keys` property
  - Set `allowRepeat: true` for continuous actions (movement)
  - Set `rateLimitMs` to throttle rapid actions

- **`useGameActionHandlers`** - Returns registered handlers object for DirectionalPad/ActionButtons
  - Use after calling `useInitializeGame`
  - Handlers are automatically created for each registered action

- **`useActiveGameActions`** - Returns Set of currently active actions
  - Pass to `activeKeys` prop for visual feedback on active buttons

- **`DirectionalPad`** - Arrow buttons for directional movement
  - Layouts: `horizontal` (left/right), `vertical` (up/down), `full` (all 4 directions)
  - Pass handlers from `useGameActionHandlers()`

- **`ActionButtons`** - Action buttons for jump, shoot, rotate, etc.
  - Supports 1-2 buttons via `onAction` and `onAction2`
  - Labels accept React nodes: text, icons, or any JSX
  - Pass `activeKeys` from `useActiveGameActions()` for visual feedback

- **`GameBoard`** - Container for game content + controls (use inside Play tab)
  - Children: Your game canvas/content
  - Controls prop: Your control buttons (goes at bottom)

- **🚫 `GameMiniLayout`** - DEPRECATED
  - Use custom `h-dvh` layouts with `Tabs` from `@neynar/ui` instead
  - See ux-design.md for the recommended pattern

**Keyboard Shortcuts Display**:

All control components support `keyboardHints` prop that shows keyboard shortcuts on hover:

- DirectionalPad shows: `A ←`, `D →`, `W ↑`, `S ↓`
- ActionButtons shows: `e Enter`, `q Shift` (or custom keys)
- Automatically deduplicates keys and shows up to 2 per button

See SDK docs: `src/neynar-farcaster-sdk/src/mini/features/game/.llm/game-features.llm.md`

**WRONG CONTROL PATTERNS**:

```tsx
// ❌ WRONG: Manual keyboard listeners (use useInitializeGame instead)
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") moveLeft();
  };
  window.addEventListener("keydown", handleKeyPress);
}, []); // Don't do this - use useInitializeGame hook!

// ❌ WRONG: Not using SDK components
<button className="bg-blue-500">Jump</button>;
// Use DirectionalPad or ActionButtons instead!

// ❌ WRONG: Invented hooks that don't exist
const { buttonPress, arrowPress } = useGameControls(); // NO! useGameControls doesn't exist
const controls = useButtonPress(); // NO! useButtonPress doesn't exist
const controls = useArrowPress(); // NO! useArrowPress doesn't exist
```

### Rule 2: Use Custom h-dvh Layout (MANDATORY)

**CRITICAL**: All games MUST use the custom `h-dvh` layout pattern with `Tabs` from `@neynar/ui`. **Do NOT use `GameMiniLayout`** - it's deprecated.

**WHY**: Custom h-dvh layouts give you full control over viewport layout while keeping code simple and maintainable.

**USAGE**: See the main example at the top of this file showing the h-dvh pattern with Tabs containing GameBoard.

**REQUIREMENTS**:

- ✅ MUST use `h-dvh flex flex-col overflow-hidden` as outer container
- ✅ MUST use `Tabs` from `@neynar/ui` for tab navigation
- ✅ Play tab should use GameBoard component with controls prop
- ✅ Game content should use full available space (w-full h-full)
- ❌ DO NOT use `GameMiniLayout` - it's deprecated
- ❌ DO NOT use `h-screen` or `100vh` in your game components

## 🎯 Game Type Specific Guidance

### Action Games

- **MUST** fit entirely in viewport (no scrolling)
- **MUST** have responsive on-screen controls
- **SHOULD** use full viewport height efficiently
- **SHOULD** minimize UI chrome to maximize play area

### Puzzle Games

- **MUST** have on-screen controls for piece manipulation
- **CAN** allow scrolling for large puzzle boards (if not time-sensitive)
- **SHOULD** show entire puzzle if possible
- **SHOULD** provide zoom controls if scrolling is necessary

### Card/Board Games

- **MUST** have touch-friendly card/piece selection
- **SHOULD** fit board in viewport when possible
- **CAN** allow scrolling for large boards (not time-sensitive)
- **MUST** have clear touch targets for game pieces

### Casual/Idle Games

- **MUST** have on-screen buttons for all interactions
- **SHOULD** fit primary interface in viewport
- **CAN** allow scrolling for menus/settings (not during active play)

## 🔊 Rule 3: Audio System Requirements (MANDATORY)

**CRITICAL**: All games MUST include sound effects and background music.

**REQUIREMENT**: Delegate audio creation to subagent (loads audio-system.md)

The subagent will:

- Create sound effects for all major game actions (jump, collect, hit, etc.)
- Compose background music matching the game's vibe
- Provide useAudio hook integration code
- Set up mute button and volume controls

**Main agent does NOT implement audio** - always delegate to audio subagent.

**See**: [audio-system.md](./audio-system.md) for complete implementation (loaded by subagent)

## 🎯 Choosing Your Rendering Approach

**Default: Use DOM/React for most games.** Only use canvas when you need smooth animation or pixel-perfect control.

### DOM/React (RECOMMENDED)

**Use for**: Puzzle games, card games, board games, trivia, clicker/idle games, turn-based strategy.

**Why**: Easier to build, less code, accessible, debuggable, responsive. Use @neynar/ui + Tailwind.

```tsx
// Tic-Tac-Toe in ~30 lines
function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const handleClick = (i: number) => {
    const newBoard = board.slice();
    newBoard[i] = "X";
    setBoard(newBoard);
  };

  return (
    <GameMiniLayout controls={<div>Current Turn: X</div>}>
      <div className="grid grid-cols-3 gap-2 p-4">
        {board.map((cell, i) => (
          <Button
            key={i}
            onClick={() => handleClick(i)}
            className="w-20 h-20 text-3xl"
          >
            {cell}
          </Button>
        ))}
      </div>
    </GameMiniLayout>
  );
}
```

### Canvas (When You Need It)

**Use for**: Action platformers, shooters, particle effects, pixel art, physics simulations.

**When**: 60fps animation, continuous movement, pixel-level control, 100+ moving sprites.

**CRITICAL - Canvas Sizing**: Canvas games MUST scale to fit the available space and NEVER scroll:

- GameBoard provides fixed height container that fills remaining space
- Canvas should use responsive sizing (width/height attributes or CSS)
- Game content should scale to fit within the canvas bounds
- ❌ NEVER allow game board to overflow and scroll
- ✅ Always constrain canvas to available viewport space

**CRITICAL - Canvas Preservation with Tabs**: When using canvas games with tabs (Play/Stats/Settings), the canvas will disappear when switching tabs because React unmounts inactive tab content. GameMiniLayout handles this automatically by keeping all tab content mounted - just use the standard tabs API:

```tsx
// ✅ CORRECT - GameMiniLayout keeps canvas mounted
function Platformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ x: 50, y: 50, vx: 0, vy: 0 });

  useInitializeGame({
    actions: {
      left: {
        handler: () => {
          playerRef.current.vx = -5;
        },
        allowRepeat: true,
      },
      right: {
        handler: () => {
          playerRef.current.vx = 5;
        },
        allowRepeat: true,
      },
      jump: {
        handler: () => {
          playerRef.current.vy = -10;
        },
      },
    },
  });

  const handlers = useGameActionHandlers();

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const gameLoop = () => {
      const player = playerRef.current;

      // Update physics
      player.x += player.vx;
      player.y += player.vy;
      player.vy += 0.5; // Gravity

      // Draw
      ctx.clearRect(0, 0, 400, 300);
      ctx.fillStyle = "blue";
      ctx.fillRect(player.x, player.y, 20, 20);

      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }, []);

  return (
    <GameMiniLayout
      tabs={[
        {
          label: "Play",
          content: (
            <GameBoard
              controls={
                <div className="flex items-center gap-4">
                  <DirectionalPad
                    layout="horizontal"
                    onLeft={controls.handlers.left}
                    onRight={controls.handlers.right}
                    keyboardHints={controls.keyBindings}
                  />
                  <ActionButtons
                    onAction={controls.handlers.jump}
                    actionLabel="Jump"
                    keyboardHints={controls.keyBindings}
                  />
                </div>
              }
            >
              <canvas ref={canvasRef} className="w-full h-full" />
            </GameBoard>
          ),
        },
        {
          label: "Stats",
          content: (
            <div className="p-4">
              <YourStatsContent />
            </div>
          ),
        },
      ]}
    />
  );
}
```

### Quick Decision

| Game Type                               | Approach                             |
| --------------------------------------- | ------------------------------------ |
| Puzzle, Card, Board, Trivia, Quiz, Idle | DOM                                  |
| Platformer, Shooter, Particle effects   | Canvas                               |
| Turn-based strategy                     | DOM (maybe canvas for visualization) |

**Rule**: If you can build it with buttons and grids, use DOM. Canvas only when needed.

## 🎨 Game UI Best Practices

### Touch-Friendly Interface Design

```tsx
// ✅ CORRECT: Use SDK components for game controls
import { ActionButtons } from "@/neynar-farcaster-sdk/game";

<ActionButtons
  onAction={handleJump}
  actionLabel="Jump"
  keyboardHints={controls.keyBindings}
/>;

// ✅ CORRECT: Responsive game container
const GameContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col h-screen max-h-screen overflow-hidden">
    {children}
  </div>
);
```

### Performance Considerations

- **Optimize rendering**: Use `requestAnimationFrame` for game loops
- **Minimize re-renders**: Memoize components, use refs for game state
- **Touch responsiveness**: Handle `touchstart` for immediate feedback (don't wait for `click`)
- **Canvas rendering**: Prefer canvas for complex animations over DOM manipulation
- **Audio efficiency**: Reuse AudioContext, create oscillators only when needed

## 🚫 Common Game Development Mistakes

### Mistake 1: Keyboard-Only Controls

```tsx
// ❌ WRONG: No mobile controls
const Game = () => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // ... keyboard handlers only
    };
    window.addEventListener("keydown", handleKey);
  }, []);

  return <canvas ref={canvasRef} />;
  // WHERE ARE THE ON-SCREEN CONTROLS?
};
```

### Mistake 2: Viewport Overflow in Action Games

```tsx
// ❌ WRONG: Game extends beyond viewport
const ActionGame = () => (
  <div>
    <div className="h-[200px]">Header</div>
    <div className="h-[800px]">Game Area</div>
    <div className="h-[200px]">Controls</div>
    {/* Total: 1200px - will require scrolling on most phones */}
  </div>
);
```

### Mistake 3: Small Touch Targets

```tsx
// ❌ WRONG: Too small for touch
<button className="w-6 h-6 text-xs">
  A
</button>

// ✅ CORRECT: Minimum 44x44px touch target
<button className="w-11 h-11 text-base">
  A
</button>
```

## 📋 Game Development Checklist

Before completing any game development task, verify:

- [ ] **Dual input support**: Game works with BOTH touch AND keyboard controls
- [ ] **On-screen controls**: All game inputs have visible touch buttons
- [ ] **Keyboard controls**: All game actions have keyboard bindings (arrow keys, spacebar, WASD, etc.)
- [ ] **Touch events**: All interactive elements handle `onTouchStart`/`onTouchEnd`
- [ ] **Keyboard events**: Window keydown listener set up for all game actions
- [ ] **GameMiniLayout**: Uses GameMiniLayout component (not custom layout)
- [ ] **Tabs component**: Uses @neynar/ui Tabs, TabsList, TabsTrigger, TabsContent (NEVER custom tabs)
- [ ] **Tab navigation**: Game has Play, Stats, and Settings tabs
- [ ] **Compact controls**: Controls are maximum 60px height with w-12 h-12 buttons
- [ ] **Touch target size**: All buttons/controls are minimum 44x44px (use w-12 h-12 = 48px)
- [ ] **Visual feedback**: Touch interactions provide clear visual feedback (active:scale-95)
- [ ] **Responsive layout**: Game adapts to different screen sizes
- [ ] **Sound effects (MANDATORY)**: Game MUST have sound effects for ALL major actions (jump, collect, game over, etc.)
- [ ] **useAudio hook**: Uses the useAudio hook from SDK
- [ ] **Background music (RECOMMENDED)**: Game includes looping background music (strongly recommended)
- [ ] **Mute button**: Mute button is accessible in main game controls
- [ ] **Settings tab**: Settings tab has separate volume controls for SFX and music
- [ ] **Audio muted by default**: Audio starts muted to respect user environment
- [ ] **Audio preferences saved**: Volume and mute preferences persist in localStorage (client-side only, acceptable for UI state)
- [ ] **Performance**: Game loop uses `requestAnimationFrame` if needed
- [ ] **Mobile testing**: Layout works on mobile viewport sizes
- [ ] **Vibe coding tone**: Communication with user is fun, approachable, and minimally technical

## 🎮 Complete Game Examples

### Example 1: DOM-Based Puzzle Game (Recommended for Most Games)

Simple memory match game using DOM components:

```tsx
"use client";

import { useState, useEffect } from "react";
import { GameBoard } from "@/neynar-farcaster-sdk/game";
import { useSfx, useSong, sfx } from "@/neynar-farcaster-sdk/audio";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  H3,
} from "@neynar/ui";

const EMOJIS = ["🎮", "🎯", "🎨", "🎭", "🎪", "🎸"];

export default function MemoryMatch() {
  const audio = useAudio();
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  // Initialize game
  useEffect(() => {
    const shuffled = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, []);

  // Background music
  useEffect(() => {
    const melody = [
      { freq: 523.25, duration: 0.4 },
      { freq: 659.25, duration: 0.2 },
      { freq: 783.99, duration: 0.6 },
      // ... more notes
    ];

    if (!audio.isMuted) {
      audio.initAudio();
      audio.startMusic(melody);
    }

    return () => audio.stopMusic();
  }, [audio.isMuted]);

  const handleCardClick = (index: number) => {
    if (
      flipped.length === 2 ||
      flipped.includes(index) ||
      matched.includes(index)
    )
      return;

    audio.initAudio();
    audio.playClickSound();

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        audio.playCoinSound();
        setMatched([...matched, ...newFlipped]);
        setScore(score + 10);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <GameMiniLayout
      tabs={[
        {
          label: "Play",
          content: (
            <GameBoard
              controls={
                <div className="flex items-center gap-4">
                  <button onClick={() => audio.setIsMuted(!audio.isMuted)}>
                    {audio.isMuted ? "🔇" : "🔊"}
                  </button>
                  <div>Score: {score}</div>
                </div>
              }
            >
              <div className="flex items-center justify-center h-full p-4">
                <div className="grid grid-cols-3 gap-2 max-w-sm">
                  {cards.map((card, i) => (
                    <Button
                      key={i}
                      onClick={() => handleCardClick(i)}
                      variant={matched.includes(i) ? "default" : "outline"}
                      className="w-20 h-20 text-3xl"
                    >
                      {flipped.includes(i) || matched.includes(i) ? card : "?"}
                    </Button>
                  ))}
                </div>
              </div>
            </GameBoard>
          ),
        },
        {
          label: "Stats",
          content: (
            <div className="p-4">
              <div>High Score: {score}</div>
            </div>
          ),
        },
      ]}
    />
  );
}
```

### Example 2: Canvas-Based Action Game (When You Need Smooth Animation)

```tsx
"use client";

import { useRef, useEffect } from "react";
import {
  GameBoard,
  DirectionalPad,
  ActionButtons,
  useInitializeGame,
  useGameActionHandlers,
} from "@/neynar-farcaster-sdk/game";
import { useSfx, sfx, MuteButton } from "@/neynar-farcaster-sdk/audio";
import { Tabs, TabsList, TabsTrigger, TabsContent, H3 } from "@neynar/ui";

export default function Platformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { play } = useSfx();
  const playerRef = useRef({ x: 50, y: 50, vx: 0, vy: 0 });

  useInitializeGame({
    actions: {
      left: {
        handler: () => {
          play(sfx.click);
          playerRef.current.vx = -5;
        },
        allowRepeat: true,
      },
      right: {
        handler: () => {
          play(sfx.click);
          playerRef.current.vx = 5;
        },
        allowRepeat: true,
      },
      jump: {
        handler: () => {
          play(sfx.blip);
          playerRef.current.vy = -10;
        },
      },
    },
  });

  const handlers = useGameActionHandlers();

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = () => {
      const player = playerRef.current;

      // Update physics
      player.x = Math.max(0, Math.min(canvas.width - 20, player.x + player.vx));
      player.y = Math.max(
        0,
        Math.min(canvas.height - 20, player.y + player.vy),
      );
      player.vy = player.y >= canvas.height - 20 ? 0 : player.vy + 0.5;

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "blue";
      ctx.fillRect(player.x, player.y, 20, 20);

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, []);

  return (
    <GameMiniLayout
      tabs={[
        {
          label: "Play",
          content: (
            <GameBoard
              controls={
                <div className="flex items-center gap-4">
                  <button onClick={() => audio.setIsMuted(!audio.isMuted)}>
                    {audio.isMuted ? "🔇" : "🔊"}
                  </button>
                  <DirectionalPad
                    layout="horizontal"
                    onLeft={controls.handlers.left}
                    onRight={controls.handlers.right}
                    keyboardHints={controls.keyBindings}
                  />
                  <ActionButtons
                    onAction={controls.handlers.jump}
                    actionLabel="Jump"
                    keyboardHints={controls.keyBindings}
                  />
                </div>
              }
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                width={400}
                height={300}
              />
            </GameBoard>
          ),
        },
      ]}
    />
  );
}
```

**Choose the approach that fits your game type!**

## 🔍 When to Load This File

Load this file whenever:

- User requests a game of any type
- User mentions: "game", "play", "puzzle", "arcade", "action", "casual game"
- User requests interactive gameplay mechanics
- User wants to add game-like features (scoring, lives, levels, etc.)

**CRITICAL**: These rules are MANDATORY for all game development. Do not skip these requirements.
