import PropTypes from 'prop-types'

export const appShape = PropTypes.shape({
  slug: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  namePrefix: PropTypes.string,
  comingSoon: PropTypes.bool,
  href: PropTypes.string,
  links: PropTypes.shape({ icon: PropTypes.string.isRequired })
})
