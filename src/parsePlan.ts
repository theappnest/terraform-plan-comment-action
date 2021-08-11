import { readFileSync } from 'fs'
import AnsiRegex from 'ansi-regex'

const ansiRegex = AnsiRegex()
const changesRegex = /^(  *)([+-])/
const updatedRegex = /^(  *)~/
const noChanges = 'Your infrastructure matches the configuration'
const objectsChanged = 'Objects have changed outside of Terraform'
const refreshingState = 'Refreshing state...'
const seperator = '─'.repeat(77)
const summaryPrefix = 'Plan: '

export function parsePlan(title: string, content: string): string {
  if (content.includes(noChanges)) {
    return ''
  }

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

  const i = content.includes(objectsChanged) ? 1 : 0
  const diff = lines
    .join('\n')
    .split(seperator, i + 1)
    [i].trim()

  return `
#### \`${title}\`: ${summary}

<details><summary>Show Plan</summary>

\`\`\`diff
${diff}
\`\`\`
</details>
`
}

export function parsePlanFile(path: string): string {
  return parsePlan(path, readFileSync(path, 'utf8'))
}
