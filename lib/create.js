const path = require('path')
const fs = require('fs-extra')
const inquirer = require('inquirer')
const Generator = require('./Generator')

module.exports = async function(name, options) {
  // console.log('>>> create.js', name, options)
  const cwd = process.cwd()
  const targetDir = path.join(cwd, name)
  if (fs.existsSync(targetDir)) { // 如果当前目录下已经存在目录
    if (options.force) { // 强制覆盖
      await fs.remove(targetDir)
    } else {
      // 询问用户是否覆盖
      const { isCover } = await inquirer.prompt([
        { 
          name: 'isCover',
          type: 'confirm',
          message: `存在目录${name}, 是否覆盖`
        }
      ])
      if (isCover) { // 覆盖
        await fs.remove(targetDir)
      }
    }
  }

  const generator = new Generator(name, targetDir)
  generator.create()
}