// For a package published as ES modules that Node loads as is: Node refuses a
// relative import without its extension. Apps bundled by rsbuild or webpack
// import without extensions, so this preset is opt-in.
export default function nodeEsm() {
  return [
    {
      plugins: ['node'],
      rules: { 'node/file-extension-in-import': ['error', 'always'] }
    }
  ]
}
