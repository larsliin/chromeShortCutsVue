module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
        'plugin:vue/vue3-essential',
    ],
    overrides: [
        {
            env: {
                node: true,
            },
            files: [
                '.eslintrc.{js,cjs}',
            ],
            parserOptions: {
                sourceType: 'script',
            },
            rules: {
                indent: 'off',
            },
        },
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: [
        'vue',
    ],
    rules: {
        'max-len': ['error', { code: 100 }],
        'import/no-extraneous-dependencies': 'off',
        indent: 'off',
        'vue/script-indent': ['error', 4, {
            baseIndent: 1,
            switchCase: 1,
            ignores: [],
        }],
        'vue/html-indent': ['error', 4, {
            baseIndent: 1,
            alignAttributesVertically: false,
        }],
    },
    settings: {
        'import/resolver': {
            alias: {
                map: [
                    ['@', './src'],
                    ['@stores', './src/shared/stores'],
                    ['@cmp', './src/shared/composables'],
                ],
            },
        },
    },
};
