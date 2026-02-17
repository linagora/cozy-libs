import { defineConfig } from '@rspack/cli'

export default defineConfig({
  entry: {
    main: './dist/index.js'
  },
  output: {
    filename: './bundle.js'
  }
})
