import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parser: tseslint.parser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'import': importPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      'import/named': 'error',
      'import/default': 'error',
      'import/no-unresolved': ['error', {
        ignore: ['cloudflare:workers', 'agents']
      }],
      "no-restricted-syntax": [
        "error",
        {
          "selector": ":function[id.name=/^[A-Z]/] CallExpression[callee.name=/^set[A-Z]/]:not(ArrowFunctionExpression CallExpression, FunctionExpression CallExpression)",
          "message": "State setters should not be called directly in the component's render body. This will cause an infinite render loop. Use useEffect or an event handler instead."
        },
        {
          "selector": "CallExpression[callee.name=/^set[A-Z]/] > :function[parent.callee.name='useMemo'], CallExpression[callee.name=/^set[A-Z]/] > :function[parent.callee.name='useCallback']",
          "message": "State setters should not be called inside useMemo or useCallback. These hooks are for memoization, not for side effects."
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'off',
      'no-undef': 'error',
      'no-unused-expressions': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
)
