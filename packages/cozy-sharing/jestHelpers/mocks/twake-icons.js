const React = require('react')

const Icon = ({ icon, ...props }) =>
  React.createElement('span', { 'data-icon': true, ...props })

const Sprite = () => null

const getFileTypeIcon = () =>
  function FileTypeIcon() {
    return React.createElement('svg', { 'data-filetypeicon': true })
  }

const proxyHandler = {
  get: function (target, prop) {
    if (prop in target) return target[prop]
    if (prop === 'default') return target.Icon
    return function IconMock(props) {
      return React.createElement('svg', { 'data-mock-icon': prop, ...props })
    }
  }
}

module.exports = new Proxy({ Icon, Sprite, getFileTypeIcon }, proxyHandler)
