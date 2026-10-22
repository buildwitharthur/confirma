import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
	globalIgnores([
		'**/dist/',
		'**/.astro/',
		'**/.turbo/',
		'**/coverage/',
		'docs/',
	]),
	{
		languageOptions: {
			globals: { ...globals.node, ...globals.browser },
		},
		linterOptions: {
			reportUnusedDisableDirectives: 'error',
		},
	},
	js.configs.recommended,
	tseslint.configs.recommended,
	astro.configs.recommended,
	prettier,
);
