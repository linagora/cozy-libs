/**
 * Get the shortcode from a permission object
 * The shortcode can be in different places depending on how the sharing was created:
 * - attributes.shortcodes.email
 * - attributes.shortcodes.code
 * - attributes.codes.email
 * - attributes.codes.code
 *
 * We used to use `email` as `codes` attribute for a sharingByLink.
 * But when we use cozy-client to create a Permission, by default
 * the codes attribute is set to `code`. MesPapiers app is using this
 * default behavior... So the sharing by link created by mes papiers
 * didn't appear correctly in cozy-sharing.
 * This is a bit ugly, we should have a better way to know if this is
 * a sharing by link or not.
 *
 * @param {object} permission - The permission object
 * @returns {string|null} The shortcode or null if not found
 */
export const getShortcode = permission => {
  return (
    permission?.attributes?.shortcodes?.email ||
    permission?.attributes?.shortcodes?.code ||
    permission?.attributes?.codes?.email ||
    permission?.attributes?.codes?.code ||
    null
  )
}
