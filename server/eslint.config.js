import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/',
      'build/',
      'uploads/',
      'storage/',
      'generated/',
      '.agents/',
      '.claude/',
      '.windsurf/',
    ],
  },

  eslint.configs.recommended,

  prettierConfig,
];
