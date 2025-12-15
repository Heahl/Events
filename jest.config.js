import {globalTeardown} from "./test-global-setup.js";

export default {
    // test env
    testEnvironment: 'node',
    // test-Ordner struktur
    testMatch: [
        '/__tests__/**/*.js?(x)',
        '**/?(*.)+(test).js?(x)'
    ],
    // test timeout
    testTimeout: 60_000,
    // test setup hier beschrieben
    globalSetup: '<rootDir>/test-global-setup.js',
    globalTeardown: '<rootDir>/test-global-setup.js',
    setupFilesAfterEnv: [],
    maxWorkers: 1,
    detectOpenHandles: true,
    maxConcurrency: 1
}