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
