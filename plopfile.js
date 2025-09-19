// plopfile.js
module.exports = function (plop) {
  // Helper para nomes
  plop.addHelper('adapterName', text => `${plop.renderString('{{pascalCase name}}Adapter', { name: text })}`);

  // 1) Gerador de Adapter
  plop.setGenerator('adapter', {
    description: 'Criar um novo adapter front-end',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Nome do Adapter (ex: MyService):'
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'frontend/js/modules/adapters/{{kebabCase name}}.js',
        templateFile: 'plop-templates/adapter.hbs'
      },
      {
        type: 'append',
        path: 'frontend/js/modules/adapters/index.js',
        pattern: '/* PLOP_EXPORTS */',
        template: "export { default as {{pascalCase name}}Adapter } from './{{kebabCase name}}';"
      }
    ]
  });

  // 2) Gerador de Módulo
  plop.setGenerator('module', {
    description: 'Criar um novo módulo JS',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Nome do módulo (ex: notifications):'
      }
    ],
