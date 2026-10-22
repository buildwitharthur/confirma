import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const isIndexable = process.env.PUBLIC_SITE_INDEXABLE === 'true';

export default defineConfig({
	output: 'static',
	site: 'https://useconfirma.com.br',
	integrations: [
		react(),
		...(isIndexable
			? [
					sitemap({
						filter: (page) => page === 'https://useconfirma.com.br/',
					}),
				]
			: []),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
