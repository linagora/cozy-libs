import providers from './providers.json'

/**
 * Get the provider corresponding to a given model name.
 * If no provider matches, return the custom provider.
 * @param {string} modelName - The name of the model.
 * @returns {object} The provider object.
 */
export const getSelectedProviderByModel = modelName => {
  return (
    providers.find(provider => provider.models?.includes(modelName)) || {
      ...providers.find(provider => provider.id === 'custom'),
      name: modelName
    }
  )
}
