const core = require('@actions/core')
const github = require('@actions/github')

const { GITHUB_TOKEN, GITHUB_WORKSPACE } = process.env

const { CLIEngine } = require(GITHUB_WORKSPACE + '/node_modules/eslint')

const {
  payload: { check_suite },
  repo: {
    repo,
    owner
  },
  sha
} = github.context

const octokit = new github.GitHub(GITHUB_TOKEN)

async function run () {
  const { data: { check_runs } } = await octokit.checks.listForSuite({
    owner,
    repo,
    check_suite_id: check_suite.id,
    status: 'in_progress'
  })
  const id = check_runs.pop().id

  const eslint = new CLIEngine({
    extensions: core.getInput('myToken') || ['.js']
  })
  const { results, errorCount, warningCount } = eslint.executeOnFiles([GITHUB_WORKSPACE])

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

  const summary = `${errorCount} error(s), ${warningCount} warning(s) found`
  await octokit.checks.update({
    owner,
    repo,
    check_run_id: id,
    output: {
      title: 'ESLint checks',
      summary,
      annotations
    }
  })

  if (errorCount < 1) return
  core.setFailed(summary)
}

;(async () => {
  try {
    await run()
  } catch (err) {
    console.error(err)
    core.setFailed(err)
  }
})()
