# @repo/eslint-config

Shared base ESLint config (`index.js`) used across the monorepo's TypeScript packages. Not published; consumed as a workspace package (`"@repo/eslint-config": "workspace:*"`).

## What it sets

- Parser: `@typescript-eslint/parser`, ES2020 modules
- Extends: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `prettier` (disables rules that conflict with Prettier formatting)
- Notable rule overrides:
  - `no-unused-vars` / `@typescript-eslint/no-unused-vars`: warn, ignoring args prefixed `_`
  - `@typescript-eslint/no-explicit-any`: warn (not error)
  - `@typescript-eslint/no-non-null-assertion`: off

## Usage

```js
// .eslintrc.js
module.exports = {
  extends: ['@repo/eslint-config']
}
```

Used by [`packages/ui`](../ui/README.md) and other TS packages; the Vite apps (`apps/web`, `apps/sms-web`) use [Biome](https://biomejs.dev) instead (see their READMEs) rather than this config.
