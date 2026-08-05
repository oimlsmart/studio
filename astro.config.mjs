// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://www.oimlsmart.org',
  base: '/studio',
  output: 'static',
  integrations: [mdx(), vue()],
  vite: {
    plugins: [tailwindcss()],
    resolve: { dedupe: ['vue'] },
  },
})
