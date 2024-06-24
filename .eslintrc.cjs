/* eslint-env node */
module.exports = {
    root: true,
    extends: [
        'plugin:vue/vue3-essential',
        '@vue/eslint-config-airbnb',
        'eslint:recommended',
    ],
    rules: {
        'no-param-reassign': ['error', { props: false }],
        camelcase: 'off',
        indent: ['error', 4],
        'linebreak-style': 0,
        'object-curly-newline': 'off',
        'import/prefer-default-export': 'off',
        'import/no-cycle': ['error', { maxDepth: 4, ignoreExternal: true }],
        'import/extensions': ['error', 'ignorePackages', { js: 'never' }],
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
    },
    overrides: [
        {
            files: ['*.vue'],
            rules: {
                indent: 'off',
            },
        },
    ],
    parserOptions: {
        ecmaVersion: 'latest',
    },
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
                extensions: ['.js', '.jsx', '.json', '.vue'],
            },
        },
    },
};
