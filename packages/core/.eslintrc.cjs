module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		sourceType: 'module',
		tsconfigRootDir: __dirname,
	},
	plugins: ['@typescript-eslint'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/recommended-requiring-type-checking'],
	rules: {
		/**
		 * Import types with `import type` instead of `import`.
		 */
		'@typescript-eslint/consistent-type-imports': 'warn',
		/**
		 * This rule is disabled because it is not possible to use the
		 * `no-unsafe-assignment` rule without breaking the build.
		 */
		'@typescript-eslint/no-unsafe-assignment': 'warn',
	},
};
