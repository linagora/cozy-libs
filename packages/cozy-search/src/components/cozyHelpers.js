import flag from 'cozy-flags'

// Cozy-only helpers kept out of `helpers.js` so the presentational view layer
// (which imports the date/name/description helpers) stays free of cozy-flags.
export const isAssistantEnabled = () => flag('cozy.assistant.enabled')
