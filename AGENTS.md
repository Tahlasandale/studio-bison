# AGENTS.md - Studio Bison V3

This file provides guidelines for AI agents working on the Studio Bison V3 project.

## Project Overview

Studio Bison V3 is a visual node-based website builder using Preact, TypeScript, Vite, and Tailwind CSS.

## Commands

```bash
# Development server
npm run dev

# Build production
npm run build

# TypeScript type checking
tsc -b

# Preview production build
npm run preview
```

Note: No test framework is currently configured. Do not add tests without approval.

## Code Style Guidelines

### Technology Stack
- **Framework:** Preact (not React)
- **Build:** Vite
- **Styling:** Tailwind CSS v4 + CSS modules
- **State:** @preact/signals
- **Database:** Dexie (IndexedDB)
- **Types:** TypeScript (strict mode)

### TypeScript Conventions
- Use Preact's JSX with `jsx` runtime (configured in tsconfig)
- Enable strict mode (`strict: true`)
- Use `erasableSyntaxOnly` for type safety
- No unused locals or parameters allowed
- Alias React imports to Preact: `react` -> `./node_modules/preact/compat`

```typescript
// Correct
import { useSignal } from '@preact/signals'
import { clsx } from 'clsx'

// Avoid - React alias not needed with preact/compat
import { useState } from 'react'  // Not needed in this project
```

### Imports
- Use path aliases for React compatibility (already configured)
- Group imports: external libs -> internal modules -> styles
- Use `verbatimModuleSyntax` - include type-only imports with `import type`

```typescript
import { useSignal } from '@preact/signals'
import type { FC } from 'preact'
import { Block } from '@/components/Block'
import styles from './Canvas.module.css'
```

### Naming Conventions
- Components: PascalCase (e.g., `BlockTree.tsx`, `Canvas.tsx`)
- Files: kebab-case (e.g., `drag.ts`, `focus.ts`)
- Hooks: camelCase with `use` prefix (standard Preact)
- Types/Interfaces: PascalCase (e.g., `Block`, `EditorState`)
- Constants: SCREAMING_SNAKE_CASE

### Component Structure
```typescript
import { useSignal } from '@preact/signals'
import type { FC } from 'preact'
import { clsx } from 'clsx'
import styles from './Component.module.css'

interface ComponentProps {
  title: string
  onSubmit?: () => void
}

export const Component: FC<ComponentProps> = ({ title, onSubmit }) => {
  const state = useSignal(false)

  const handleClick = () => {
    state.value = !state.value
    onSubmit?.()
  }

  return (
    <div class={clsx(styles.container, state.value && styles.active)}>
      <button onClick={handleClick}>{title}</button>
    </div>
  )
}
```

### Error Handling
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Handle async operations with try/catch
- Display errors to user via status messages

### Tailwind CSS
- Use utility classes for layout and styling
- Use `clsx` and `tailwind-merge` (`cn` pattern) for conditional classes
- Avoid custom CSS when Tailwind utilities suffice

```typescript
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

// Usage
<div class={cn('flex items-center', isActive && 'bg-blue-500')}>
```

### State Management
- Use `@preact/signals` for reactive state
- Prefer signals over useState for global/derived state
- Define stores in `src/stores/`

### Database (Dexie)
- Define schemas in `src/lib/db.ts`
- Use async/await for all DB operations
- Handle migration for schema changes

## Project Structure

```
src/
├── app.tsx          # Root component
├── main.tsx         # Entry point
├── components/     # Reusable UI components
├── lib/             # Utilities (drag, focus, db)
├── stores/          # Global state (signals)
├── types/           # TypeScript types
├── assets/          # Static assets
├── index.css        # Global styles
└── app.css          # App-level styles
```

## Restrictions

- **DO NOT** add React dependencies - use Preact
- **DO NOT** add Bootstrap, Material UI, or other CSS frameworks - Tailwind only
- **DO NOT** add test frameworks without approval
- **DO NOT** add new dependencies without approval
- **DO NOT** modify tsconfig.json strict settings
- **ALWAYS** run `tsc -b` before marking a task complete

## Validation Checklist

Before completing a task:
1. [ ] Run `npx tsc -b` - no type errors
2. [ ] Run `npm run build` - successful build
3. [ ] No lint errors if eslint is added
4. [ ] Code follows conventions above
