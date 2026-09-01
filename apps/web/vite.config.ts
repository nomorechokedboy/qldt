import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import reactSWC from '@vitejs/plugin-react-swc'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
	build: { target: 'es2022' },
	optimizeDeps: { esbuildOptions: { target: 'es2022' } },
	plugins: [
		tanstackRouter({ autoCodeSplitting: true }),
		tailwindcss(),
		reactSWC()
	],
	test: {
		globals: true,
		environment: 'jsdom'
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src')
		}
	}
})
