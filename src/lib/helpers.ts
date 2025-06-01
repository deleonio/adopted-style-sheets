export const isTestEnvironment = (): boolean => {
	// Node.js-Umgebungsvariablen
	const env = typeof process !== 'undefined' && process.env ? process.env : {};
	const isNodeEnvTest = env.NODE_ENV === 'test';
	const isVitest = 'VITEST' in env;
	const isJest = 'JEST_WORKER_ID' in env;
	const isPlaywright = 'PLAYWRIGHT_TEST_BASE_URL' in env;
	const isCI = env.CI === 'true';
	const isCustomTestEnv = env.TEST === 'true' || env.IS_TEST === 'true';

	// Browser-seitige Merkmale
	const isWebDriver = typeof navigator !== 'undefined' && navigator.webdriver === true;
	const isTestUserAgent = typeof navigator !== 'undefined' && /playwright|puppeteer|webdriver|selenium|testcafe/i.test(navigator.userAgent);

	return isNodeEnvTest || isVitest || isJest || isPlaywright || isCI || isCustomTestEnv || isWebDriver || isTestUserAgent;
};
