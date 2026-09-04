# @repo/ui

Shared React component library used by [`apps/web`](../../apps/web/README.md) and [`apps/sms-web`](../../apps/sms-web/README.md) — [shadcn/ui](https://ui.shadcn.com)-style primitives on top of Radix, styled with Tailwind CSS v4, plus a couple of app-shell pieces (sidebar) shared between both frontends.

Not published; consumed as a workspace package (`"@repo/ui": "workspace:*"`).

## Exports

Subpath exports only, defined in `package.json`:

| Import | Resolves to |
| --- | --- |
| `@repo/ui/globals.css` | `src/globals.css` — Tailwind base styles/theme tokens |
| `@repo/ui/postcss.config` | `postcss.config.mjs` — re-exportable PostCSS config |
| `@repo/ui/lib/*` | `src/lib/*.ts` (e.g. `cn` class-merge helper) |
| `@repo/ui/components/*` | `src/components/*.tsx`, plus `src/components/app-sidebar/*` |

## Structure

```
ui/
├── src/
│   ├── components/
│   │   ├── ui/            shadcn-style primitives (button, dialog, dropdown-menu, tabs, tooltip, ...)
│   │   └── app-sidebar/    Shared app-shell sidebar components
│   ├── hooks/               Shared React hooks
│   ├── lib/                  Utilities (e.g. `cn`)
│   └── globals.css           Tailwind v4 theme
├── postcss.config.mjs
└── components.json          shadcn CLI config
```

## Adding a component

Prefer generating via the shadcn CLI from an app directory pointed at this package's `components.json`, then adjust imports to the `@repo/ui/components/*` subpath convention. New components should stay Radix-based and use `cn` (`@repo/ui/lib/cn`) for class merging, consistent with the existing primitives in `src/components/ui/`.

## Lint

```bash
cd packages/ui
pnpm lint
```

Uses [`@repo/eslint-config`](../eslint-config/README.md) and [`@repo/typescript-config`](../typescript-config/README.md).
