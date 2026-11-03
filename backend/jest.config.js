/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Défini avant l'import de tout module (donc avant src/config/env.ts) afin
  // que ses required(...) ne lèvent pas au chargement pendant les tests.
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
};
