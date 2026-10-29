import { define } from 'rstack'

import fmt from './config/rslint-config-cozy-app/fmt.js'
import react from './config/rslint-config-cozy-app/react.js'

define.lint(lint => [
  { ignores: ['**/.storybook/*', '**/__testfixtures__'] },
  ...react(lint)
])

define.fmt({
  ...fmt,
  ignorePatterns: [
    // Formatted by remark
    '*.md',
    // Email templates and stylesheet, whose text is rendered as is
    '*.hbs',
    '*.mjml',
    'packages/cozy-notifications/src/style.css',
    // Compared as is with the output of the codemods
    '__testfixtures__'
  ]
})
