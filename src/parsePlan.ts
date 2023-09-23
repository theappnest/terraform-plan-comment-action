import { readFileSync } from 'fs'
import * as core from '@actions/core'
import AnsiRegex from 'ansi-regex'
import { glob } from 'glob'

const ansiRegex = AnsiRegex()
const changesRegex = /^(  *)([+-])/
const updatedRegex = /^(  *)~/
const noChanges = 'Your infrastructure matches the configuration'
const objectsChanged = 'Objects have changed outside of Terraform'
const outputChanges = 'Changes to Outputs'
const refreshingState = 'Refreshing state...'
const seperator = '─'.repeat(77)
const summaryPrefix = 'Plan: '

export function parsePlan(title: string, content: string): string {
  if (content.includes(noChanges)) {
    core.setOutput('terraform-changes', 'false')
    return ''
  }

  core.setOutput('terraform-changes', 'true')

  const lines = content
    .split('\n')
    .filter((line) => !line.includes(refreshingState))
    .map((line) =>
      line
        .replace(ansiRegex, '')
        .replace(changesRegex, '$2$1')
        .replace(updatedRegex, '!$1'),
    )

  const summary = lines
    .find((line) => line.startsWith(summaryPrefix))
    ?.slice(summaryPrefix.length)

  if (content.includes(outputChanges)) {
    if (summary === undefined || !summary.match('((?!^\\d))')) {
      core.setOutput('terraform-changes', 'false')
      return ''
    }
  }

  const i = content.includes(objectsChanged) ? 1 : 0
  const diff = lines
    .join('\n')
    .split(seperator, i + 1)
    [i].trim()

  return summary
    ? `
#### \`${title}\`: ${summary}

<details><summary>Show Plan</summary>

\`\`\`diff
${diff}
\`\`\`
</details>
`
    : `
#### :warning: Something went wrong for \`${title}\` module. Check logs.
`
}

function trimPrefix(path: string, prefix: string) {
  const escaped = prefix.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  const re = new RegExp(`^${escaped}/?`)
  return path.replace(re, '')
}

function trimExt(path: string) {
  return path.replace(/\.\w*$/, '')
}

export function parsePlanDir(path: string, prefix?: string): string {
  const paths = glob.sync(path, { nodir: true })
  return paths.reduce((acc, file) => {
    const name = prefix ? trimPrefix(file, prefix) : file
    return acc + parsePlan(trimExt(name), readFileSync(file, 'utf8'))
  }, '')
}
