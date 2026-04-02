# Configuration for AI agents

## ESLint Configuration

This project uses ESLint rules from `cozy-libs`. When generating code, strictly follow these rules:

### Configuration files

- `config/eslint-config-cozy-app/basics.js`
- `config/eslint-config-cozy-app/react.js`

### Important rules to follow

#### Prettier (formatting)

```javascript
'prettier/prettier': [
  'error',
  {
    arrowParens: 'avoid',      // No parentheses for single-parameter arrow functions
    endOfLine: 'auto',         // Automatic line ending
    semi: false,               // NO SEMICOLONS at end of lines
    singleQuote: true,         // Single quotes
    trailingComma: 'none'      // NO TRAILING COMMAS
  }
]
```

#### Import/Order (import order)

- Mandatory alphabetical order (`alphabetize: { order: 'asc' }`)
- Import groups in this order:
  1. `builtin` (Node.js modules)
  2. `external` (npm packages)
  3. `internal` (project internal imports)
  4. `['parent', 'sibling', 'index']` (relative imports)
- Special pattern for cozy-\_ and twake-\_ (position after external)
- Empty line between each group (`newlines-between: 'always'`)

#### React

- `react/prop-types`: off (disabled)
- `react/jsx-curly-brace-presence`: no unnecessary braces for props and children
- No `display-name` in .spec files

#### TypeScript (if applicable)

- `explicit-function-return-type`: required
- `no-explicit-any`: forbidden

### Compliant code example

```javascript
import React from "react";

import Button from "cozy-ui/transpiled/react/Buttons";
import cx from "classnames";

import FieldInput from "./FieldInput";
import { makeIsRequiredError } from "./helpers";

const MyComponent = ({ name, label }) => {
  const isError = makeIsRequiredError(name);

  return (
    <div className={cx("u-mt-1", { "u-flex": isError })}>
      <FieldInput name={name} label={label} />
    </div>
  );
};

export default MyComponent;
```

Note:

- No semicolons
- Single quotes
- No trailing comma
- Alphabetical import order (React before Button, Button before cx)
- Empty line between import groups (builtin/external, external/internal, etc.)
