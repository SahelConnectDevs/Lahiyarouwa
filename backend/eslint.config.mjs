// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // Les handlers d'erreur Express (voir middlewares/error.middleware.ts)
      // doivent garder leurs 4 paramètres même si certains sont inutilisés.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Un console.log qui traîne ne doit pas passer en revue silencieusement ;
      // les quelques usages volontaires (server.ts, error.middleware.ts) sont
      // explicitement dérogés via un commentaire eslint-disable.
      'no-console': 'warn',
    },
  },
  {
    // Fichiers de config CommonJS exécutés directement par Node (pas par le
    // programme TypeScript de src/), donc pas typés par typescript-eslint.
    files: ['*.config.js', '*.config.cjs'],
    languageOptions: {
      globals: { module: 'writable', require: 'readonly', __dirname: 'readonly', process: 'readonly' },
    },
  },
);
