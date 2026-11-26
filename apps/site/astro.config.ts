import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import { SITE } from './src/data/site'

export default defineConfig({
  site: SITE.url,
  output: 'static',
  integrations: [sitemap()],
})
