'use strict';

// Here's a JavaScript-based config file.
// If you need conditional logic, you might want to use this type of config.
// Otherwise, JSON or YAML is recommended.

module.exports = {
	extension: ['js', 'jsx', 'ts', 'tsx'],
	reporter: 'spec',
	require: ['esbuild-register', './.mocharc.setup.cjs'],
	spec: ['src/**/*.spec.*s*', 'src/**/*.test.*s*', 'tests/**/*.spec.*s*', 'tests/**/*.test.*s*'],
};

// Source: https://github.com/mochajs/mocha/tree/master/example/config
