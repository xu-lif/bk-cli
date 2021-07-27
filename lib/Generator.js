const ora = require('ora')
const http = require('./http.js')
const inquirer = require('inquirer')
const util = require('util')
const downloadGitRepo = require('download-git-repo')
const path = require('path')

async function wrapLoading(func, message, ...options) {
  const oraSpinner = ora(message)
  oraSpinner.start()
  try {
    const res = await func(...options)
    oraSpinner.succeed()
    return res
  } catch(err) {
    console.log(err)
    oraSpinner.fail('Request failed, refetch ...')
  }
}

// 创建模版类
class Generator {
  constructor(name, targetDir) {
    this.name = name
    this.targetDir = targetDir
    this.downloadGitRepo = util.promisify(downloadGitRepo);
  }

  // 远程拉取模版数据
  async getRepo () {
    const res = await wrapLoading(http.getRepoList, '开始拉取模版信息')
    if(!res) return
    const repos = res.map(item => item.name)
    const { repo } = await inquirer.prompt([
      {
        name: "repo",
        type: "list",
        choices: repos,
        message: '请选择模版来创建项目'
      }
    ])
    return repo
  }

  // 远程拉取版本信息
  async getTag(repo) {
    const res = await wrapLoading(http.getTagList, '开始拉取版本信息', repo)
    if (!res) return
    const tagsList = res.map(item => item.name);

    // 2）用户选择自己需要下载的 tag
    const { tag } = await inquirer.prompt({
      name: 'tag',
      type: 'list',
      choices: tagsList,
      message: '请选择版本来创建项目'
    })
    return tag
  }

  async download(repo, tag) {
    const requestUrl = `zhurong-cli/${repo}${tag?'#'+tag:''}`;
    console.log(requestUrl)
    // 2）调用下载方法
    await wrapLoading(
      this.downloadGitRepo, // 远程下载方法
      '等待下载模版', // 加载提示信息
      requestUrl, // 参数1: 下载地址
      path.resolve(process.cwd(), this.targetDir)) // 参数2: 创建位置
  }
  async create() {
    const repoSelected = await this.getRepo()
    const tagSelected = await this.getTag(repoSelected)
    console.log(`您挑选的模版为${repoSelected}, 版本为${tagSelected}`)
    await this.download(repoSelected, tagSelected)
  }
}

module.exports = Generator