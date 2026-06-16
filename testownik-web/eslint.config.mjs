import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', 'playwright-report/', 'test-results/'] },
  {
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['src/**/*.ts', 'tests/**/*.ts', '*.config.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    extends: [pluginVue.configs['flat/recommended']],
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
