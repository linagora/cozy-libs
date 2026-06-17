const { imports } = require('..')

module.exports = function transformUiBC140(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Match cozy-ui icon import patterns:
  // - cozy-ui/transpiled/react/Icon (default import)
  // - cozy-ui/transpiled/react/Icon/Sprite (default import)
  // - cozy-ui/transpiled/react/Icons/Check (default import)
  const iconImportRegex =
    /^cozy-ui\/transpiled\/react\/(Icon(\/Sprite)?$|Icons\/[^/]+$)/

  root.find(j.ImportDeclaration).forEach(path => {
    const source = path.node.source.value
    if (!iconImportRegex.test(source)) return

    // Extract component name from the PATH, not the local name
    let componentName
    if (source.includes('/Icons/')) {
      componentName = source.split('/').pop()
    } else if (source.endsWith('/Icon/Sprite')) {
      componentName = 'Sprite'
    } else {
      componentName = 'Icon'
    }

    const spec = path.node.specifiers[0]
    const localName = spec.local?.name

    // Rename all usages if local name differs from component name
    if (localName && localName !== componentName) {
      root.find(j.Identifier, { name: localName }).forEach(idPath => {
        idPath.node.name = componentName
      })
    }

    // Add new named import
    imports.ensure(
      root,
      { [componentName]: componentName },
      '@linagora/twake-icons'
    )

    // Remove old import
    j(path).remove()
  })

  // Merge all @linagora/twake-icons imports into one
  const twakeImports = root.find(j.ImportDeclaration, {
    source: { value: '@linagora/twake-icons' }
  })
  if (twakeImports.length > 1) {
    const allSpecifiers = []
    twakeImports.forEach(path => {
      allSpecifiers.push(...path.node.specifiers)
    })
    twakeImports
      .at(0)
      .replace(
        j.importDeclaration(allSpecifiers, j.literal('@linagora/twake-icons'))
      )
    twakeImports.slice(1).forEach(path => j(path).remove())
  }

  return root.toSource()
}

module.exports.description =
  'Replaces cozy-ui Icon, Sprite, and Icons imports with @linagora/twake-icons'
