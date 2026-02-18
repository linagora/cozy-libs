import { defineConfig } from '@rspack/cli'

export default defineConfig({
  entry: {
    main: './dist/legacy.js'
  },
  output: {
    filename: './bundle.js'
  }
})
