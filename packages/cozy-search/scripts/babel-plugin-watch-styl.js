const fs = require('fs')
const path = require('path')

const chokidar = require('chokidar')

let started = false

module.exports = function () {
  return {
    name: 'watch-styl',
    pre() {
      if (started || !process.argv.includes('--watch')) return
      started = true

      const srcDir = path.resolve(process.cwd(), 'src')
      const watcher = chokidar.watch(path.join(srcDir, '**/*.styl'), {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 }
      })

      const pokeJsImporters = stylPath => {
        const dir = path.dirname(stylPath)
        const stylBasename = path.basename(stylPath)
        const importRegex = new RegExp(
          `(?:import|require)\\s*[^'"]*['"][^'"]*${stylBasename.replace(/\./g, '\\.')}['"]`
        )
        const importers = fs
          .readdirSync(dir)
          .filter(f => /\.(jsx?|tsx?)$/.test(f) && !/\.(d|spec)\./.test(f))
          .filter(f =>
            importRegex.test(fs.readFileSync(path.join(dir, f), 'utf8'))
          )
        const now = new Date()
        importers.forEach(f => fs.utimesSync(path.join(dir, f), now, now))
      }

      watcher.on('change', pokeJsImporters)
    }
  }
}
