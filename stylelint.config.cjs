// stylelint.config.cjs
module.exports = {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-prettier"
  ],
  rules: {
    // Formatação e estilo geral
    "indentation": 2,
    "string-quotes": "double",
    "max-empty-lines": 2,
    "no-eol-whitespace": true,
    "color-hex-case": "lower",
    "color-hex-length": "short",
    "declaration-no-important": true,

    // Boas práticas
    "no-descending-specificity": true,
    "selector-max-id": 0,
    "selector-max-class": 3,
    "unit-whitelist": ["em", "rem", "%", "s", "px", "vh", "vw"],
    "selector-class-pattern": "^[a-z][a-z0-9\\-]+$"
  }
};
