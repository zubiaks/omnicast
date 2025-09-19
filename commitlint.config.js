// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: 'conventional-changelog-conventionalcommits',
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',
        'backend',
        'lib',
        'scripts',
        'docs',
        'assets',
        'config'
      ]
    ],
    'scope-empty': [2, 'ignore'],
    'subject-case': [2, 'always', ['lower-case']],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 10],
    'header-max-length': [2, 'always', 72]
  }
};
