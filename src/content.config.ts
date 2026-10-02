import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { generatedDir } from './lib/version.mjs';

// Same loader as Starlight's docsLoader, pointed at the generated pages of the version being built.
export const collections = {
	docs: defineCollection({
		loader: glob({ base: `${generatedDir}/docs`, pattern: '**/[^_]*.{md,mdx}' }),
		schema: docsSchema(),
	}),
};
