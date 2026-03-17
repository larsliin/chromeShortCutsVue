/* eslint-env node */
module.exports = {
    root: true,
    globals: {
        chrome: 'readonly',
    },
    extends: [
        'plugin:vue/vue3-essential',
        '@vue/eslint-config-airbnb',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    plugins: ['@typescript-eslint'],
    parser: 'vue-eslint-parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
    },
    rules: {
        'no-param-reassign': ['error', { props: false }],
        'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
        'vue/max-len': ['error', { code: 150, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreUrls: true }],
        'max-len': ['error', { code: 150, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreUrls: true }],
        camelcase: 'off',
        indent: ['error', 4],
        'linebreak-style': 0,
        'object-curly-newline': 'off',
        'import/prefer-default-export': 'off',
        'import/no-cycle': ['error', { maxDepth: 4, ignoreExternal: true }],
        'import/extensions': ['error', 'ignorePackages', { js: 'never', ts: 'never' }],
        'vue/first-attribute-linebreak': 'off',
        'vue/require-default-prop': 'off',
        'vue/script-indent': ['error', 4, {
            baseIndent: 1,
        }],
        'vue/html-indent': ['error', 4, {
            baseIndent: 1,
            alignAttributesVertically: false,
        }],
        'vue/html-closing-bracket-newline': ['error', {
            singleline: 'never',
            multiline: 'never',
        }],
        'vue/html-self-closing': ['error', {
            html: {
                void: 'always',
                normal: 'never',
                component: 'always',
            },
            svg: 'always',
            math: 'always',
        }],
        // TypeScript-specific rules
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
        }],
        'no-unused-vars': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-require-imports': 'off',
        // Replace base no-shadow with TS-aware version (fixes enum false-positives)
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
    },
    overrides: [
        {
            files: ['*.vue'],
            rules: {
                indent: 'off',
            },
        },
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                'no-undef': 'off',
            },
        },
        {
            files: ['*.config.ts', '*.config.js', '*.config.mjs', '*.config.cjs'],
            rules: {
                'import/no-extraneous-dependencies': 'off',
                'no-underscore-dangle': 'off',
            },
        },
    ],
    settings: {
        'import/resolver': {
            alias: {
                map: [
                    ['@', './src'],
                    ['@assets', './src/shared/assets'],
                    ['@cmp', './src/shared/composables'],
                    ['@stores', './src/shared/stores'],
                    ['@use', './src/shared/use'],
                ],
                extensions: ['.js', '.jsx', '.json', '.vue', '.ts', '.tsx'],
            },
        },
    },
};
