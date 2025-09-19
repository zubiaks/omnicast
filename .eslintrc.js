// .eslintrc.js
module.exports = {
  root: true,

  env: {
    browser: true,
    node:    true,
    jest:    true,
    es2021:  true
  },

  parserOptions: {
    ecmaVersion: 2021,
    sourceType:  'module'
  },

  extends: [
    'eslint:recommended',
    'standard',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/order',
    'plugin:prettier/recommended'
  ],

  plugins: ['import'],

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json']
      },
      alias: {
        map: [
          ['@',        './frontend/js'],
          ['@modules', './frontend/js/modules'],
          ['@pages',   './frontend/js/pages'],
          ['~css',     './frontend/assets/css'],
          ['~img',     './frontend/assets/img']
        ],
        extensions: ['.js', '.json']
      }
    }
  },

  globals: {
    sessionStorage: 'readonly'
  },

  rules: {
    quotes:        ['error', 'single', { avoidEscape: true }],
    semi:          ['error', 'always'],
    'no-console':  ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'import/order': [
      'error',
      {
        groups:            ['builtin','external','internal',['parent','sibling','index']],
        'newlines-between': 'always'
      }
    ]
  },

  overrides: [
    {
      files: ['tests/**/*.js'],
      env:   { jest: true },
      rules: {
        'no-undef':      'off',
        'padded-blocks': 'off',
        'key-spacing':   'off',
        'quote-props':   'off'
      }
    },
    {
      files: ['scripts/**/*.js'],
      env:   { node: true },
      parserOptions: {
        sourceType: 'script'
      }
    }
  ]
}
