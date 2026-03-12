import { defineConfig, globalIgnores } from 'eslint/config'

import reactConfig from './config/eslint-config-cozy-app/react.js'

export default defineConfig([
  globalIgnores([
    'config/*/node_modules',
    'config/*/coverage',
    'config/*/dist',
    'packages/*/node_modules',
    'packages/*/coverage',
    'packages/*/dist',
    '**/.storybook/*',
    '**/__testfixtures__'
  ]),
  ...reactConfig
])
