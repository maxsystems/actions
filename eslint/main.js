const core = require('@actions/core')
const github = require('@actions/github')

const { GITHUB_SHA, GITHUB_EVENT_PATH, GITHUB_TOKEN, GITHUB_WORKSPACE, GITHUB_ACTION } = process.env

const { CLIEngine } = require(GITHUB_WORKSPACE + '/node_modules/eslint')

const {
  repository,
  repository: {
    name: repo,
    owner: { login: owner }
  }
} = github.context.event

const octokit = new github.GitHub(GITHUB_TOKEN)

async function run () {
  const { data: id } = await octokit.checks.create({
    owner,
    repo,
    name: GITHUB_ACTION,
    head_sha: GITHUB_SHA,
    status: 'in_progress',
    started_at: new Date()
  })

  const eslint = new CLIEngine({
    extensions: core.getInput('myToken')
  })
  const { results, errorCount, warningCount } = eslint.executeOnFiles(['.'])

  const levels = ['', 'warning', 'failure']

  const annotations = results.reduce((result, { filePath, messages }) => {
    const path = filePath.substring(GITHUB_WORKSPACE.length + 1)
    result.push(...messages.map(({ line, severity, ruleId, message }) => ({
      path,
      start_line: line,
      end_line: line,
      annotation_level: levels[severity],
      message: `[${ruleId}] ${message}`
    })))
    return result
  }, [])

  await octokit.checks.update({
    owner,
    repo,
    check_run_id: id,
    status: 'completed',
    completed_at: new Date(),
    conclusion: errorCount > 0 ? 'failure' : 'success',
    output: {
      title: GITHUB_ACTION,
      summary: `${errorCount} error(s), ${warningCount} warning(s) found`,
      annotations
    }
  })
}


try {
  run()
} catch (err) {
  core.setFailed(err)
}
