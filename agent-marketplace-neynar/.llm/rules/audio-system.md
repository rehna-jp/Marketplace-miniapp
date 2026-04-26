# Neynar Farcaster Mini App Template - Audio System Rules

**CRITICAL**: This file contains comprehensive audio system guidance for Farcaster mini apps. Load this file when implementing sound effects, background music, or any audio features.

## Prerequisites

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

## Overview

This file provides complete guidance for using the Neynar audio SDK (useSfx, useSong) to create audio experiences in Farcaster mini apps.

**This file covers**:

- How to use the useSfx() and useSong() hooks
- Available instruments and their capabilities
- Sound effect and music composition patterns
- Audio configuration and best practices

**This file does NOT cover**:

- Where to create audio files (that's handled by specific agents)
- File naming conventions (that's handled by specific agents)
- Export patterns (that's handled by specific agents)

---

## 🔊 Audio System Overview

The audio system provides two powerful declarative hooks for creating rich audio experiences:

- **`useSfx()`** - Declarative sound effects with 10 built-in effects
- **`useSong()`** - Declarative music composition with 10 instruments

Both use Tone.js and Jotai for automatic volume/mute management.

## 🎮 Sound Effects with useSfx()

### Basic Usage

```tsx
import { useSfx, sfx } from "@/neynar-farcaster-sdk/audio";

function MyGame() {
  const sfxPlayer = useSfx();

  const handleCoinCollect = () => {
    sfxPlayer.play(sfx.coin);
  };

  return <button onClick={handleCoinCollect}>Collect Coin</button>;
}
```

**Key Points:**

- No need to call `init()` - the SDK handles it automatically on first play
- Import `sfx` registry for built-in effects
- Name your `useSfx()` variable something other than `sfx` to avoid naming conflicts

### Built-in Sound Effects

The SDK includes 10 ready-to-use effects in the `sfx` registry:

- `sfx.coin` - Two-tone success chime (C5 → E5)
- `sfx.jump` - Ascending sweep with envelope
- `sfx.hit` - Noise burst + bass impact
- `sfx.powerup` - Ascending 4-note arpeggio (C4 → E4 → G4 → C5)
- `sfx.explosion` - Bass boom + noise burst + synth decay
- `sfx.click` - Quick UI beep
- `sfx.success` - Multi-chord ascending fanfare (15 notes)
- `sfx.failure` - Descending sad notes (E4 → Eb4 → D4 → C4)
- `sfx.menuSelect` - Pluck UI tone

### Creating Custom Sound Effects

Define custom effects as `SfxDefinition` arrays:

```tsx
// Example: custom-sfx.ts
import type { SfxDefinition } from "@/neynar-farcaster-sdk/audio";

// Simple laser shot
export const laserShot: SfxDefinition = [
  {
    instrument: "fm",
    note: "E6",
    duration: "0.15",
    config: {
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
    },
  },
];

// Multi-note effect with delays
export const itemPickup: SfxDefinition = [
  { instrument: "pluck", note: "A4", duration: "0.15" },
  { instrument: "pluck", note: "C5", duration: "0.15", delay: 80 },
  { instrument: "pluck", note: "E5", duration: "0.15", delay: 160 },
];
```

```tsx
// Example: Using custom effects in a component
import { laserShot, itemPickup } from "@/features/audio/custom-sfx";

function MyGame() {
  const sfxPlayer = useSfx();

  sfxPlayer.play(laserShot);
  sfxPlayer.play(itemPickup);
}
```

### Available SFX Instruments

**7 instruments available:**

1. **synth** - Tone.Synth - General-purpose tone generator
   - Use for: Melodies, beeps, tones, UI feedback
   - Supports: Note pitch, envelope, oscillator type

2. **noise** - Tone.NoiseSynth - White noise generator
   - Use for: Impacts, explosions, whooshes, hi-hats
   - Note: Doesn't use note pitch, only duration

3. **pluck** - Tone.PluckSynth - Plucked string sound
   - Use for: Harp-like tones, guitar plucks, UI selections
   - Supports: Note pitch, attackNoise, dampening

4. **bass** - Tone.MonoSynth - Deep bass synthesizer
   - Use for: Low impacts, rumbles, bass hits
   - Supports: Note pitch, envelope, filter

5. **fm** - Tone.FMSynth - Frequency modulation synth
   - Use for: Metallic bells, electronic tones, tuned effects
   - Produces: Clean, musical metallic sounds

6. **metal** - Tone.MetalSynth - Inharmonic metallic percussion
   - Use for: Cymbals, crashes, shimmers, sparkles
   - **CAUTION**: Highly inharmonic - NOT for melodies
   - Best for: Atmospheric shimmer, sci-fi effects

7. **membrane** - Tone.MembraneSynth - Drum membrane
   - Use for: Kicks, toms, percussion
   - Supports: Note pitch, envelope

### Instrument Best Practices

**When to use metal:**

- ✅ Cymbal crashes and shimmers
- ✅ Bell-like atmospheric textures
- ✅ Sparkly accent effects
- ✅ Space/sci-fi ambience
- ❌ NOT for musical melodies (it's inharmonic)
- ❌ NOT for item pickups (use pluck instead)

**When to use fm vs metal:**

- Use `fm` when you need tuned metallic bells or electronic tones
- Use `metal` when you need cymbal-like, noisy, shimmery effects

**General principle:**

- Use appropriate instruments for the sound character you want
- Don't force instruments where they don't fit
- Simpler is often better - most effects only need 1-3 instruments

### SFX Note Structure

```typescript
type SfxNote = {
  instrument:
    | "synth"
    | "noise"
    | "pluck"
    | "bass"
    | "fm"
    | "metal"
    | "membrane";
  note?: string; // Musical note (e.g., "C5", "A4") - omit for noise
  duration: string; // Tone.js time (e.g., "0.1", "16n")
  delay?: number; // Milliseconds to delay this note
  config?: {
    oscillator?: string; // "sine", "square", "triangle", "sawtooth"
    volume?: number; // dB adjustment (e.g., -10 to +10)
    envelope?: {
      attack?: number; // Attack time in seconds
      decay?: number; // Decay time in seconds
      sustain?: number; // Sustain level (0-1)
      release?: number; // Release time in seconds
    };
  };
};

type SfxDefinition = SfxNote[];
```

### Advanced SFX Examples

```tsx
// Teleport effect with ascending synth whoosh + sparkle
export const teleport: SfxDefinition = [
  {
    instrument: "synth",
    note: "C5",
    duration: "0.1",
    config: { oscillator: "sine" },
  },
  {
    instrument: "synth",
    note: "G5",
    duration: "0.1",
    delay: 50,
    config: { oscillator: "sine" },
  },
  {
    instrument: "synth",
    note: "C6",
    duration: "0.15",
    delay: 100,
    config: { oscillator: "sine" },
  },
  { instrument: "fm", note: "C7", duration: "0.15", delay: 120 },
  { instrument: "noise", duration: "0.08", delay: 120, config: { volume: -8 } },
];

// Level up fanfare with clean timing
export const levelUp: SfxDefinition = [
  {
    instrument: "synth",
    note: "C5",
    duration: "0.1",
    config: { oscillator: "triangle" },
  },
  {
    instrument: "synth",
    note: "E5",
    duration: "0.1",
    delay: 100,
    config: { oscillator: "triangle" },
  },
  {
    instrument: "synth",
    note: "G5",
    duration: "0.1",
    delay: 200,
    config: { oscillator: "triangle" },
  },
  {
    instrument: "synth",
    note: "C6",
    duration: "0.25",
    delay: 300,
    config: { oscillator: "triangle" },
  },
];

// Explosion with bass + noise burst
export const explosion: SfxDefinition = [
  { instrument: "noise", duration: "0.3", config: { volume: -3 } },
  { instrument: "bass", note: "C1", duration: "0.4" },
  { instrument: "membrane", note: "C2", duration: "0.3", delay: 50 },
];
```

## 🎼 Music with useSong()

### Basic Usage

```tsx
import { useSong, type SongDefinition } from "@/neynar-farcaster-sdk/audio";

function MyApp() {
  const song = useSong();

  const mySong: SongDefinition = {
    sections: {
      main: {
        melody: [
          ["C4", "4n"],
          ["E4", "4n"],
          ["G4", "4n"],
          ["C5", "2n"],
        ],
        bassLine: [
          ["C2", "2n"],
          ["G2", "2n"],
        ],
        drumPattern: "simple",
      },
    },
    structure: ["main"],
    tempo: 120,
  };

  useEffect(() => {
    song.play(mySong);
    return () => song.stop();
  }, []);

  return <div>My App</div>;
}
```

### The 10 Available Instruments

**Core Instruments (Use in most songs):**

1. **melody** - Lead synth (Tone.Synth)
   - Use for: Main melodies, lead lines, single-note themes
   - Can play: Single notes OR chords
   - Example: `melody: [["C5", "4n"], [["C5", "E5", "G5"], "2n"]]`

2. **bassLine** - Bass synth (Tone.MonoSynth)
   - Use for: Low-end foundation, bass grooves
   - Can play: Single notes only
   - Example: `bassLine: [["C2", "4n"], ["F2", "4n"]]`

3. **chords** - Pad synth (Tone.PolySynth)
   - Use for: Harmonic background, sustained chords
   - Can play: Chords only (arrays of notes)
   - Example: `chords: [[["C4", "E4", "G4"], "2n"]]`

4. **drums** - Automatic drum patterns (Tone.MembraneSynth)
   - Controlled by: `drumPattern: "simple" | "complex" | "heavy" | "none"`
   - **CRITICAL**: Only these exact values are valid - do NOT use "medium", "light", "intense" or any other values
   - **Simple**: Kick on 1 & 3, snare on 2 & 4 (basic rock beat)
   - **Complex**: Adds hi-hat on off-beats (more energetic)
   - **Heavy**: Double kicks, constant hi-hats, extra snare hits (intense/aggressive)
   - **None**: No drums (for ambient/quiet sections)

**Melodic Enhancement:**

5. **arp** - Arpeggiated synth (Tone.PluckSynth)
   - Use for: Fast arpeggios, sparkly accents, harp textures
   - Example: `arp: [["C5", "16n"], ["E5", "16n"], ["G5", "16n"]]`

6. **duo** - Duo synth (Tone.DuoSynth)
   - Use for: Rich harmonized leads, thick sounds, brass-like tones
   - Sound: Two detuned oscillators with vibrato
   - Example: `duo: [["C5", "4n"], ["E5", "4n"]]`

7. **am** - AM synth (Tone.AMSynth)
   - Use for: Vintage sounds, tremolo effects, pulsing tones
   - Sound: Amplitude modulation creates rhythmic pulsing
   - Example: `am: [["A4", "2n"], ["C5", "4n"]]`

**Textural/Atmospheric:**

8. **fx** - FM synth (Tone.FMSynth)
   - Use for: Bell tones, sparkly accents, atmospheric sounds
   - Example: `fx: [["G5", "8n"], ["C6", "4n"]]`

9. **metal** - Metal synth (Tone.MetalSynth)
   - Use for: Metallic bells, shimmers, cinematic resonance
   - Sound: Inharmonic, long decay, bell-like
   - Example: `metal: [["C5", "2n"], ["G5", "4n"]]`

10. **noise** - Noise synth (Tone.NoiseSynth)
    - Use for: Hi-hats, texture, atmospheric whooshes
    - Note: Pitch is ignored, only duration matters
    - Example: `noise: [["C4", "16n"], ["C4", "16n"]]`

### Drum Pattern Reference

**Available drum patterns** (use ONLY these exact values):

```tsx
drumPattern: "simple"; // Basic: Kick on 1 & 3, snare on 2 & 4
drumPattern: "complex"; // Energetic: Adds hi-hats on off-beats
drumPattern: "heavy"; // Aggressive: Double kicks, constant hi-hats, extra snares
drumPattern: "none"; // Silent: No drums
```

**When to use each pattern:**

- **simple**: Most songs, casual games, chill vibes, background music
- **complex**: Upbeat songs, action games, energetic sections, choruses
- **heavy**: Intense games, boss fights, climactic moments, metal/rock vibes
- **none**: Ambient sections, quiet moments, intros/outros, puzzle games

**Example progression:**

```tsx
sections: {
  intro: { melody: [...], drumPattern: "none" },       // Quiet intro
  verse: { melody: [...], drumPattern: "simple" },     // Build energy
  chorus: { melody: [...], drumPattern: "heavy" },     // Maximum intensity
  outro: { melody: [...], drumPattern: "simple" }      // Wind down
}
```

### Instrument Selection Guide

**IMPORTANT**: Don't force all instruments into every song. Choose instruments that serve the song's character and mood.

**Upbeat/Epic songs:**

- melody + bassLine + chords + arp + duo + drumPattern: "complex" or "heavy"

**Ambient/Mellow songs:**

- chords + bassLine + arp + metal + fx + am + drumPattern: "none"

**Cinematic/Dramatic:**

- duo + metal + melody + chords + fx + drumPattern: "simple" or "heavy"

**Retro/Vintage:**

- am + arp + bassLine + melody + drumPattern: "simple"

**Space/Sci-Fi:**

- metal + fx + noise + chords + drumPattern: "none" or "complex"

### Per-Section Instrument Configuration

Customize instrument sounds per section:

```tsx
sections: {
  intro: {
    metal: [["C5", "2n"], ["G5", "2n"]],
    config: {
      metal: {
        volume: 5,
        envelope: {
          attack: 0.001,
          decay: 0.8,
          sustain: 0.1,
          release: 2.0
        }
      }
    }
  }
}
```

### Per-Section Tempo Changes

Each section can override the global tempo for dramatic effect:

```tsx
const song: SongDefinition = {
  sections: {
    intro: {
      melody: [
        ["C5", "4n"],
        ["E5", "4n"],
      ],
      tempo: 80, // Slow, atmospheric intro
    },
    verse: {
      melody: [
        ["D5", "8n"],
        ["E5", "8n"],
      ],
      tempo: 120, // Normal tempo
    },
    chorus: {
      melody: [
        ["G5", "8n"],
        ["A5", "8n"],
      ],
      tempo: 140, // Speed up for energy!
    },
  },
  structure: ["intro", "verse", "chorus"],
  tempo: 120, // Global default tempo
};
```

**Use cases:**

- Slow intro, speed up to energetic chorus
- Bridge that slows down for dramatic effect
- Final chorus that speeds up for climax
- Progressive tempo increase throughout song

### Song Structure

```tsx
const song: SongDefinition = {
  sections: {
    intro: {
      /* instrument patterns */
    },
    verse: {
      /* instrument patterns */
    },
    chorus: {
      /* instrument patterns */
    },
    bridge: {
      /* instrument patterns */
    },
  },
  structure: [
    "intro",
    "verse",
    "chorus",
    "verse",
    "chorus",
    "bridge",
    "chorus",
  ],
  tempo: 120, // BPM (optional, default: 120)
};
```

### Complete Song Example

```tsx
import type { SongDefinition } from "@/neynar-farcaster-sdk/audio";

const themeSong: SongDefinition = {
  sections: {
    intro: {
      melody: [
        ["C5", "4n"],
        ["E5", "4n"],
        ["G5", "4n"],
        ["C6", "2n"],
      ],
      chords: [[["C4", "E4", "G4"], "1n"]],
    },
    verse: {
      melody: [
        ["C5", "4n"],
        ["D5", "4n"],
        ["E5", "4n"],
        ["G5", "4n"],
      ],
      bassLine: [
        ["C2", "2n"],
        ["G2", "2n"],
      ],
      arp: [
        ["C5", "16n"],
        ["E5", "16n"],
        ["G5", "16n"],
        ["C6", "16n"],
      ],
      drumPattern: "simple",
    },
    chorus: {
      melody: [
        ["E5", "4n"],
        ["G5", "4n"],
        ["C6", "4n"],
        ["E6", "2n"],
      ],
      duo: [
        ["E6", "4n"],
        ["G6", "4n"],
        ["C7", "4n"],
        ["E7", "2n"],
      ],
      bassLine: [
        ["C2", "4n"],
        ["C2", "4n"],
      ],
      chords: [[["C4", "E4", "G4"], "1n"]],
      drumPattern: "complex",
    },
  },
  structure: ["intro", "verse", "verse", "chorus", "verse", "chorus"],
  tempo: 120,
};
```

## 🎛️ Audio Controls

### UI Components

The SDK provides two components:

1. **AudioControl** - Volume sliders for SFX and Music
2. **MuteButton** - Global mute toggle

```tsx
import { AudioControl, MuteButton } from "@/neynar-farcaster-sdk/audio";

function MySettings() {
  return (
    <div>
      <MuteButton />
      <AudioControl />
    </div>
  );
}
```

### Accessing Audio State

For advanced use cases, access the Jotai atoms directly:

```tsx
import { useAtom } from "jotai";
import {
  isMutedAtom,
  sfxVolumeAtom,
  musicVolumeAtom,
} from "@/neynar-farcaster-sdk/audio";

function CustomControls() {
  const [isMuted, setIsMuted] = useAtom(isMutedAtom);
  const [sfxVolume, setSfxVolume] = useAtom(sfxVolumeAtom);
  const [musicVolume, setMusicVolume] = useAtom(musicVolumeAtom);

  // Your custom UI
}
```

## 📋 Best Practices

**Sound Effects:**

- ✅ Keep effects short (< 500ms) for responsive feel
- ✅ Use appropriate instruments (pluck for UI, bass for impacts)
- ✅ Don't overuse metal - it's very distinctive
- ✅ Layer 2-3 instruments for rich effects
- ✅ Use delays to create sequences

**Music:**

- ✅ Don't force all 10 instruments into every song
- ✅ Choose instruments that fit the mood
- ✅ Layer melody + bass + chords as foundation
- ✅ Add arp/duo/am for character
- ✅ Use metal/fx/noise sparingly for atmosphere
- ✅ Vary note durations for musicality
- ✅ Structure songs in sections (intro/verse/chorus)

**Audio Management:**

- ✅ SDK auto-initializes on first play
- ✅ Volume/mute state persists via Jotai atoms
- ✅ Always provide mute button and volume controls
- ✅ Clean up with `song.stop()` when unmounting

## 🚫 Common Mistakes

```tsx
// ❌ WRONG - Naming conflict
const sfx = useSfx();
sfx.play(sfx.coin); // 'sfx' refers to the hook, not the registry!

// ✅ CORRECT - Different names
const sfxPlayer = useSfx();
sfxPlayer.play(sfx.coin);

// ❌ WRONG - Using metal for melody
melody: [
  { instrument: "metal", note: "C5", duration: "4n" },
  { instrument: "metal", note: "E5", duration: "4n" },
] // Sounds terrible - metal is inharmonic!

// ✅ CORRECT - Use synth/duo for melodies
melody: [
  { instrument: "synth", note: "C5", duration: "4n" },
  { instrument: "synth", note: "E5", duration: "4n" },
]

// ❌ WRONG - Forcing all instruments
// Don't do this unless the song really needs it!
sections: {
  verse: {
    melody: [...],
    bassLine: [...],
    chords: [...],
    arp: [...],
    duo: [...],
    am: [...],
    fx: [...],
    metal: [...],
    noise: [...],
  }
}

// ✅ CORRECT - Use what serves the song
sections: {
  verse: {
    melody: [...],
    bassLine: [...],
    chords: [...],
    drumPattern: "simple",
  }
}
```

## 🎹 Musical Reference

### Note Duration Reference

- `"1n"` - Whole note (4 beats)
- `"2n"` - Half note (2 beats)
- `"4n"` - Quarter note (1 beat)
- `"8n"` - Eighth note (0.5 beats)
- `"16n"` - Sixteenth note (0.25 beats)

### Rest Notes (Silent Pauses)

**CRITICAL**: To create silent pauses in melodies, use `["rest", duration]` format:

```tsx
const song: SongDefinition = {
  sections: {
    verse: {
      melody: [
        ["C5", "4n"], // Play C5 for 1 beat
        ["rest", "4n"], // Silent pause for 1 beat (rest)
        ["E5", "4n"], // Play E5 for 1 beat
        ["rest", "4n"], // Silent pause for 1 beat (rest)
        ["G5", "2n"], // Play G5 for 2 beats
      ],
    },
  },
  structure: ["verse"],
  tempo: 120,
};
```

**Rest Notes in Different Instruments**:

All instruments support rest notes using `["rest", duration]`:

```tsx
sections: {
  chorus: {
    melody: [
      ["C5", "4n"],
      ["rest", "4n"],       // Quarter note rest in melody
      ["E5", "4n"],
    ],
    bassLine: [
      ["C2", "2n"],
      ["rest", "2n"],       // Half note rest in bass
      ["G2", "2n"],
    ],
    chords: [
      [["C4", "E4", "G4"], "2n"],
      ["rest", "2n"],       // Half note rest in chords
      [["G4", "B4", "D5"], "2n"],
    ],
  },
}
```

**Why Use Rest Notes:**

- ✅ Create rhythmic breathing room and space in melodies
- ✅ Add syncopation and rhythmic interest
- ✅ Prevent songs from sounding "too busy" or cluttered
- ✅ Create call-and-response patterns between instruments
- ✅ Build tension before important musical moments

**Musical Patterns with Rests:**

```tsx
// Staccato melody (short notes with rests)
melody: [
  ["C5", "16n"], ["rest", "16n"], ["C5", "16n"], ["rest", "16n"],
  ["E5", "16n"], ["rest", "16n"], ["G5", "16n"], ["rest", "16n"],
]

// Call and response (melody rests while bass plays)
sections: {
  main: {
    melody: [
      ["C5", "4n"], ["E5", "4n"],         // Melody plays
      ["rest", "4n"], ["rest", "4n"],     // Melody rests
    ],
    bassLine: [
      ["rest", "4n"], ["rest", "4n"],     // Bass rests
      ["C2", "4n"], ["G2", "4n"],         // Bass plays
    ],
  },
}

// Syncopated rhythm
melody: [
  ["C5", "8n"], ["rest", "8n"], ["E5", "16n"],
  ["rest", "16n"], ["G5", "8n"], ["rest", "8n"],
]
```

### Common Notes

**Middle octave (C4-B4):**

- C4, D4, E4, F4, G4, A4, B4

**Higher octave (C5-B5):**

- C5, D5, E5, F5, G5, A5, B5

**Bass octave (C2-B2):**

- C2, D2, E2, F2, G2, A2, B2

### Sharps and Flats (Accidentals)

**All notes support sharps (#) and flats (b):**

- **Sharps**: C#, D#, F#, G#, A# (e.g., `"C#5"`, `"F#4"`)
- **Flats**: Db, Eb, Gb, Ab, Bb (e.g., `"Db5"`, `"Bb4"`)

**Enharmonic equivalents** (same pitch, different names):

- C# = Db
- D# = Eb
- F# = Gb
- G# = Ab
- A# = Bb

**When to use sharps/flats:**

1. **Part of a key signature**: Many keys include sharps or flats naturally
   - G Major: F#
   - D Major: F#, C#
   - F Major: Bb
   - Bb Major: Bb, Eb

2. **Chromatic passing tones**: Add interest and sophistication

   ```typescript
   // Chromatic run ascending: C → C# → D
   (["C5", "16n"],
     ["C#5", "16n"],
     ["D5", "8n"][
       // Chromatic run descending: E → Eb → D
       ("E5", "16n")
     ],
     ["Eb5", "16n"],
     ["D5", "8n"]);
   ```

3. **Color and dissonance**: Create tension/release or jazz flavor
   ```typescript
   // Blues-style flat 3rd and flat 7th
   (["C5", "4n"], ["Eb5", "4n"], ["G5", "4n"], ["Bb5", "4n"]);
   ```

**Best practices:**

- ✅ Use accidentals when they serve the music (key signature, chromatic movement, color)
- ✅ Chromatic passing tones add smooth melodic motion
- ✅ Flat/sharp approach notes create nice tension before resolving
- ❌ Don't force them if the melody sounds good without
- ❌ Too many accidentals in a row can sound random/atonal

### Musical Scales

**You're not limited to these scales!** These are examples to get started. Any combination of notes is valid - experiment with different scales, modes, and exotic patterns.

**Common Western Scales:**

**C Major** (happy, bright):

- C-D-E-F-G-A-B-C

**A Minor** (sad, mysterious):

- A-B-C-D-E-F-G-A

**G Major** (bright, with F#):

- G-A-B-C-D-E-F#-G

**D Minor** (dramatic, with Bb):

- D-E-F-G-A-Bb-C-D

**C Pentatonic** (neutral, no dissonance):

- C-D-E-G-A-C

**Quirky & Exotic Scales:**

**C Blues Scale** (soulful, jazzy):

- C-Eb-F-Gb-G-Bb-C

**C Bebop Major** (jazzy, sophisticated):

- C-D-E-F-G-G#-A-B-C

**C Bebop Dominant** (swinging jazz):

- C-D-E-F-G-A-Bb-B-C

**C Dorian** (jazzy minor, smooth):

- C-D-Eb-F-G-A-Bb-C

**C Mixolydian** (bluesy, dominant):

- C-D-E-F-G-A-Bb-C

**C Phrygian** (Spanish, Middle Eastern):

- C-Db-Eb-F-G-Ab-Bb-C

**C Lydian** (dreamy, ethereal):

- C-D-E-F#-G-A-B-C

**C Whole Tone** (mysterious, floating):

- C-D-E-F#-G#-A#-C

**C Diminished** (tense, unsettling):

- C-D-Eb-F-Gb-Ab-A-B-C

**C Harmonic Minor** (dramatic, classical):

- C-D-Eb-F-G-Ab-B-C

**C Japanese Pentatonic** (zen, peaceful):

- C-Db-F-G-Ab-C

**C Hungarian Minor** (exotic, dramatic):

- C-D-Eb-F#-G-Ab-B-C

### Key Modulation (Changing Keys Mid-Song)

Songs can change key during playback for dramatic effect! This is called **modulation**.

**Common modulation techniques:**

1. **Direct modulation** - Jump to new key in a new section

   ```typescript
   sections: {
     verse: {
       melody: [["C5", "4n"], ["E5", "4n"], ["G5", "4n"]],  // C Major
     },
     chorus: {
       melody: [["D5", "4n"], ["F#5", "4n"], ["A5", "4n"]],  // D Major (up a step)
     }
   }
   ```

2. **Up a half-step** - Classic pop/rock energy boost

   ```typescript
   finalChorus: {
     melody: [["F5", "4n"], ["A5", "4n"], ["C6", "4n"]],  // Half-step up from E
   }
   ```

3. **Relative major/minor** - Emotional shift

   ```typescript
   verse: {
     melody: [["A4", "4n"], ["C5", "4n"], ["E5", "4n"]],  // A Minor (sad)
   },
   chorus: {
     melody: [["C5", "4n"], ["E5", "4n"], ["G5", "4n"]],  // C Major (happy)
   }
   ```

4. **Chromatic modulation** - Use chromatic notes to smoothly transition
   ```typescript
   bridge: {
     melody: [
       ["G5", "4n"],
       ["G#5", "8n"],  // Chromatic passing tone
       ["A5", "4n"]    // New key center
     ],
   }
   ```

**Best practices:**

- ✅ Modulate to create energy, drama, or emotional shifts
- ✅ Common modulations: up a half-step, up a whole step, to relative major/minor
- ✅ Use chromatic notes as "pivot points" between keys
- ✅ Bass and chords should follow the new key
- ❌ Don't modulate randomly without musical purpose

---

**Remember**: Great audio enhances the user experience! Use sound thoughtfully to provide feedback, create atmosphere, and make your app feel polished and responsive.
