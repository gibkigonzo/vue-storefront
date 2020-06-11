const fs = require('fs')
const execa = require('execa')
const path = require('path')
const semverInc = require('semver/functions/inc')
const semverSatisfies = require('semver/functions/satisfies')
const semverCoerce = require('semver/functions/coerce')
const merge = require('lodash/merge')
const themes = require('./consts').themes
const { getVersion } = require('./helpers')

const createThemeTasks = (installationDir = 'vue-storefront') => ({
  installDeps: {
    title: 'Installing dependencies',
    task: () => execa.shell('cd ' + installationDir + ' && yarn')
  },
  cloneTheme: {
    title: 'Copying Vue Storefront theme',
    task: answers => execa.shell([
      `git clone --quiet --single-branch --branch ${answers.themeBranch} https://github.com/DivanteLtd/vsf-${answers.themeName}.git ${installationDir}/src/themes/${answers.themeName}`,
      `cd ${installationDir}/src/themes/${answers.themeName}`,
      `git remote rm origin`
    ].join(' && ')),
    skip: answers => {
      if (fs.existsSync(`${installationDir}/src/themes/${answers.themeName}`)) {
        return `Chosen theme already exists in Vue Storefront installation directory ./${installationDir}/src/themes/`
      }
    }
  },
  configureTheme: {
    title: 'Configuring Vue Storefront theme',
    task: answers => {
      const configurationFiles = ['local.config.js', 'local.json']
      const [themeLocalConfigJsPath, themeLocalJsonPath] = configurationFiles.map(
        file => `${installationDir}/src/themes/${answers.themeName}/${file}`
      )
      const vsfLocalJsonPath = path.join(installationDir, '/config/local.json')
      const vsfPackageJsonPath = path.join(installationDir, '/package.json')

      try {
        const isVsfVersionAsBranch = ['master', 'develop'].includes(answers.specificVersion || getVersion(installationDir))
        const vsfVersionFromPackageJson = JSON.parse(fs.readFileSync(vsfPackageJsonPath)).version
        const vsfVersion = isVsfVersionAsBranch
          ? semverInc(vsfVersionFromPackageJson, 'minor')
          : vsfVersionFromPackageJson

        const vsfLocalJson = fs.existsSync(vsfLocalJsonPath)
          ? JSON.parse(fs.readFileSync(vsfLocalJsonPath))
          : {}

        const themeLocalJson = fs.existsSync(themeLocalConfigJsPath)
          ? require(fs.realpathSync(themeLocalConfigJsPath))(vsfVersion)
          : fs.existsSync(themeLocalJsonPath)
            ? JSON.parse(fs.readFileSync(themeLocalJsonPath))
            : null

        if (themeLocalJson) {
          fs.writeFileSync(vsfLocalJsonPath, JSON.stringify(merge(vsfLocalJson, themeLocalJson), null, 2))
        }
      } catch (e) {
        console.error(`Problem with parsing or merging configurations (${configurationFiles})\n`, e)
      }
    },
    skip: answers => {
      const configurationFiles = ['local.config.js', 'local.json', 'local.config']
      const themePath = `${installationDir}/src/themes/${answers.themeName}`

      if (configurationFiles.every(file => !fs.existsSync(`${themePath}/${file}`))) {
        return `
          Missing configuration file in theme folder - nothing to configure.
          Theme path: ${themePath}.
          Configuration files: ${configurationFiles}.
        `
      }
    }
  }
})

const createThemePrompt = (installationDir = 'vue-storefront') => [
  {
    type: 'list',
    name: 'themeName',
    message: 'Select theme for Vue Storefront',
    choices: answers => {
      const isVsfVersionAsBranch = ['master', 'develop'].includes(answers.specificVersion || getVersion(installationDir))
      const selectedVsfVersion = semverCoerce(answers.specificVersion || getVersion(installationDir))

      return Object.entries(themes)
        .filter(([, themeConfig]) => isVsfVersionAsBranch || semverSatisfies(selectedVsfVersion, themeConfig.minVsfVersion, { includePrerelease: true }))
        .map(([themeName, themeConfig]) => ({
          name: themeConfig.label,
          value: themeName
        }))
    }
  },
  {
    type: 'list',
    name: 'themeBranch',
    message: 'Select theme version',
    choices: answers => Object.entries(themes[answers.themeName].branches)
      .map(([branchName, branchLabel]) => ({
        name: branchLabel,
        value: branchName
      }))
  }
]

module.exports = {
  createThemeTasks,
  createThemePrompt
}
