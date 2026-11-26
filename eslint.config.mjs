import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/.astro/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    },
  },
  {
    // Dependency rule: domain must remain pure (no Node I/O, no UI framework, no app imports).
    files: ['packages/game-core/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['node:*', 'fs', 'path', 'http', 'react', 'react-*', '*apps/*'],
        },
      ],
    },
  },
  {
    // App boundary: watcher must never import from web.
    files: ['apps/watcher/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['*apps/web*', 'react', 'react-*'],
        },
      ],
    },
  },
  {
    // App boundary: web must never import from watcher or Node built-ins.
    files: ['apps/web/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['*apps/watcher*', 'node:*'],
        },
      ],
    },
  },
)
