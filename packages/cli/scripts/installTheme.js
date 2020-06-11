
const execa = require('execa')
const inquirer = require('inquirer')
const Listr = require('listr')
const { createThemeTasks, createThemePrompt } = require('./themeTasks')

module.exports = function (installationDir = '.') {
  const tasks = createThemeTasks(installationDir)

  inquirer
    .prompt(createThemePrompt(installationDir))
    .then(answers => {
      const taskQueue = []
      taskQueue.push(tasks.cloneTheme)
      taskQueue.push(tasks.installDeps)
      taskQueue.push(tasks.configureTheme)
      new Listr(taskQueue).run(answers)
    })
}
