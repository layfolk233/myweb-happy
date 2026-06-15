const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './',
    timeout: 30000,
    expect: {
        timeout: 5000,
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
        browserName: 'firefox',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
});
