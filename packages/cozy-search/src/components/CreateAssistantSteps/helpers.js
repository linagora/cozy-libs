import providers from './providers.json'

/**
 * Get the provider corresponding to a given model name.
 * If no provider matches, return the custom provider.
 * @param {string} providerId - The ID of the provider.
 * @returns {object} The provider object.
 */
export const getSelectedProviderById = providerId => {
  return (
    providers.find(provider => provider.id === providerId) || {
      ...providers.find(provider => provider.id === 'custom')
    }
  )
}

/**
 * Get the display name of a provider.
 * The custom provider has no name of its own, only a translation key.
 * @param {object} provider - The provider object.
 * @param {Function} t - The translation function.
 * @returns {string} The provider display name.
 */
export const getProviderName = (provider, t) => {
  return provider.id === 'custom' ? t(provider.name) : provider.name
}

/**
 * Get the display name of a provider from its ID, used to name its account.
 * Resolves against providers.json rather than against a selected provider,
 * whose name is overridden by the dialogs.
 * @param {string} providerId - The ID of the provider.
 * @param {Function} t - The translation function.
 * @returns {string} The provider display name.
 */
export const getProviderNameById = (providerId, t) => {
  return getProviderName(getSelectedProviderById(providerId), t)
}

/**
 * Check whether the given model is unsupported by the provider.
 * @param {object} provider - The provider object.
 * @param {string} model - The model name.
 * @returns {boolean} True if the model is unsupported.
 */
export const checkIfModelUnsupported = (provider, model) => {
  const unsupportedModels = provider?.unsupportedModels || []
  return unsupportedModels.includes(model?.trim())
}
