import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	output: 'static',
	site: 'https://useconfirma.com.br',
	integrations: [
		react(),
		sitemap({
			filter: (page) => page === 'https://useconfirma.com.br/',
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Manrope',
			cssVariable: '--font-manrope',
			weights: ['400 600'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Bricolage Grotesque',
			cssVariable: '--font-bricolage',
			weights: ['500 700'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['sans-serif'],
			options: {
				experimental: {
					variableAxis: { opsz: [['12', '96']] },
				},
			},
		},
		{
			provider: fontProviders.google(),
			name: 'Geist Mono',
			cssVariable: '--font-geist-mono',
			weights: ['400 600'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['monospace'],
		},
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
