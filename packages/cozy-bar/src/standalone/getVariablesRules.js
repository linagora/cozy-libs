// Returns the custom properties declared on `selectors`, in source order. The
// lookbehind does not consume the previous `}`, so adjacent rules all match.
export const getVariablesRules = (css, selectors) =>
  [...css.matchAll(/(?<=^|})([^{}@]+)\{([^{}]*)\}/g)]
    .filter(([, ruleSelectors]) =>
      ruleSelectors.split(',').some(s => selectors.includes(s.trim()))
    )
    .map(([, , body]) =>
      body
        .split(';')
        .filter(declaration => declaration.trim().startsWith('--'))
        .join(';')
    )
