import basics, { noUnusedVarsOptions, testFiles } from './basics.js'

const tsFiles = ['**/*.{ts,tsx,mts,cts}']

export default function react(lint) {
  const { reactPlugin, reactHooksPlugin, ts } = lint
  const onTsFiles = configs =>
    configs.map(config => ({ ...config, files: tsFiles }))

  return [
    ...basics(lint),
    // Rslint scopes the React preset to .jsx and .tsx files
    { ...reactPlugin.configs.recommended, files: ['**/*.{js,jsx,tsx}'] },
    reactHooksPlugin.configs.recommended,
    {
      settings: { react: { version: 'detect' } },
      rules: {
        // Rslint's no-unused-vars does not see the React of classic JSX
        'no-unused-vars': [
          'error',
          { ...noUnusedVarsOptions, varsIgnorePattern: '^React$' }
        ],
        'react/prop-types': 'off',
        'react/jsx-curly-brace-presence': [
          'error',
          { props: 'never', children: 'never' }
        ]
      }
    },
    ...onTsFiles(ts.configs.recommendedTypeChecked),
    ...onTsFiles(ts.configs.strict),
    {
      files: tsFiles,
      languageOptions: { parserOptions: { projectService: true } },
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': ['error', noUnusedVarsOptions],
        '@typescript-eslint/no-invalid-void-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-useless-constructor': 'warn',
        '@typescript-eslint/no-dynamic-delete': 'warn'
      }
    },
    {
      files: testFiles,
      rules: { 'react/display-name': 'off' }
    }
  ]
}
