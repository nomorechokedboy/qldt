# @repo/typescript-config

Shared base `tsconfig.json` files for the monorepo. Config-only, `private: true`, no build output — consumed via `"extends"` as a workspace package (`"@repo/typescript-config": "workspace:*"`).

## Configs

| File | Extends | For |
| --- | --- | --- |
| `base.json` | — | Strict TS baseline (`strict: true`, `isolatedModules`, `moduleResolution: Bundler`, ESNext modules, declarations on) |
| `react-library.json` | `base.json` | Adds `jsx: react-jsx` — for React component packages like `packages/ui` |
| `vite.json` | `base.json` | Adds Vite app settings: `noEmit`, DOM lib, `noUnusedLocals`/`noUnusedParameters`/`noImplicitReturns` — for `apps/web` and `apps/sms-web` |

## Usage

```json
// tsconfig.json
{
  "extends": "@repo/typescript-config/vite.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["src"]
}
```
