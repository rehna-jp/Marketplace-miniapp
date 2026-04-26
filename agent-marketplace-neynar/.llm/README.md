# LLM Rules System

## Philosophy

This directory contains a structured system of rules and documentation designed to guide LLMs (like Claude) through Farcaster mini app development with maximum effectiveness and minimal context waste.

### Core Principles

1. **Progressive Disclosure**: Rules are organized into focused files that LLMs read in sequence, building context progressively rather than frontloading everything.

2. **Just-In-Time Context**: LLMs only access detailed documentation when they actually need it, reducing token waste and improving response quality.

3. **Prevention Over Correction**: Common mistakes are documented with clear prevention scenarios, helping LLMs avoid problems before they occur.

4. **Discovery Over Memory**: Clear patterns for finding SDK types, hooks, and utilities mean LLMs don't need to memorize—they know how to look things up.

5. **Human-Readable Structure**: While optimized for LLM consumption, the rules remain clear and maintainable for human developers.

## Structure

### Entry Point

- **`../prompts/miniapp-agent-unified-prompt.md`**: The unified system prompt that orchestrates the entire development process. This is the single entry point for LLMs.

### Domain-Specific Rules

The `rules/` directory contains focused, domain-specific rule files:

- **`audio-system.md`**: Complete audio system architecture and patterns
- **`database-persistence.md`**: Database patterns, schemas, and state management
- **`game-development.md`**: Game-specific patterns, controls, and mechanics
- **`social-features.md`**: Farcaster integration and social features
- **`data-visualization.md`**: Charts, graphs, and data display patterns
- **`image-generation.md`**: AI image generation workflows
- **`ui-component-guide.md`**: UI components and styling patterns
- **`farcaster-mini-guide.md`**: Understanding Farcaster mini app SDK

### Core Rules (in `rules/`)

The `rules/` directory also contains universal rules:

- `core-coding-standards.md`: Coding standards and patterns
- `debugging.md`: Inline debugging rules for fixing errors and bugs
- `ux-design.md`: Visual design standards and spacing patterns

### Reference Documentation

- **`reference/`**: Detailed component APIs, type definitions, and implementation guides
  - Organized by domain (auth, audio, ui, etc.)
  - Accessed on-demand when LLM needs specific details

## How It Works

1. **User Request**: Developer asks Claude to build/modify something
2. **System Prompt**: `miniapp-agent-unified-prompt.md` determines workflow and what rules to load
3. **Domain Rules**: Claude loads only the relevant domain-specific rules (e.g., `audio-system.md` for games)
4. **Research Phase**: Claude searches codebase and checks relevant patterns
5. **Implementation**: Claude implements using established patterns from loaded rules
6. **Validation**: Claude validates work against workflow completion requirements
7. **Reference Lookup**: If needed, Claude accesses detailed docs in `reference/` directory

## Keeping It Up To Date

### When SDK Changes

When the Neynar SDK structure changes (new hooks, moved types, etc.):

```
Please update the relevant domain rule files to reflect the new SDK structure.
For example, if social features SDK hooks change, update .llm/rules/social-features.md
```

### When New Patterns Emerge

When you discover better ways to do things:

```
I noticed we're now doing [X] differently. Please:
1. Update the relevant domain rule file in .llm/rules/
2. Update any affected reference docs in .llm/reference/
3. If it's a common mistake, add a prevention pattern to the rule file
```

### When New Features Are Added

When adding new core features (like audio system, new auth flow, etc.):

```
Please document the new [feature] system:
1. Create a new domain rule file in .llm/rules/[feature].md if it's a major system
2. Add reference documentation in .llm/reference/[domain]/
3. Update ../prompts/miniapp-agent-unified-prompt.md if workflow changes are needed
```

### When Mistakes Keep Happening

When you notice Claude making the same mistake repeatedly:

```
Claude keeps [doing wrong thing]. Please add a prevention pattern to the relevant
rule file in .llm/rules/ that explains:
- What the mistake is
- Why it happens
- How to detect it
- The correct approach
```

### Regular Maintenance

Periodically review and consolidate:

```
Please review the .llm/ directory and:
1. Remove outdated information
2. Consolidate duplicate content
3. Update examples to match current patterns
4. Ensure all cross-references are valid
```

## Best Practices for Prompting Updates

### Be Specific

```
Good: "Update audio-system.md to include the new streaming buffer pattern"
Bad: "Fix the audio docs"
```

### Provide Context

```
Good: "The SDK moved types from /models to /types. Update neynar-sdk-discovery.md
      to reflect this, especially the import path patterns."
Bad: "SDK changed, update docs"
```

### Reference Examples

```
Good: "I added a new pattern in src/features/auth/session-manager.tsx.
      Please document this in .llm/rules/prevention-scenarios.md
      similar to how we documented the audio hook patterns."
Bad: "Document the new thing I made"
```

### Request Verification

```
Good: "After updating, please verify that all example import paths
      in neynar-sdk-discovery.md are valid by checking the actual SDK structure."
Bad: "Update and you're done"
```

## Benefits

### For LLMs

- Clear navigation path through complex codebase
- Efficient context usage (read only what's needed)
- Consistent patterns reduce hallucination
- Prevention scenarios catch mistakes early

### For Developers

- Single source of truth for architecture
- Easy to update when patterns change
- Self-documenting codebase evolution
- Onboarding guide for new team members

### For the Project

- Maintains consistency across features
- Reduces debugging time from LLM mistakes
- Preserves institutional knowledge
- Scales as complexity grows

## Quick Reference

**Entry point for LLMs**: `../prompts/miniapp-agent-unified-prompt.md` (the unified system prompt)

**Most frequently updated**:

- Domain rule files in `rules/` (as patterns evolve and mistakes are discovered)
- `reference/` docs (when component APIs change)

**Least frequently updated**:

- `../prompts/miniapp-agent-unified-prompt.md` (only when workflow fundamentally changes)

**When in doubt**: Prompt Claude to update it! The system is designed to be self-maintaining through good prompting.
