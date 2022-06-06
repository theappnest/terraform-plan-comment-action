import { context, getOctokit } from '@actions/github'
import { PullRequestEvent } from '@octokit/webhooks-types'

const header = `## Terraform infrastructure changes\n\n`
const footer = `\n\n---\n\nThis comment was generated with [terraform-plan-comment](https://github.com/theappnest/terraform-plan-comment-action).\nComment ID: `

export async function createComment(
  token: string,
  content: string,
  commentId: string,
  subheader: string,
): Promise<void> {
  const body =
    header +
    (subheader ? `### ${subheader}` : subheader) +
    (content || `No changes detected.`) +
    footer +
    commentId

  const octokit = getOctokit(token)

  const { pull_request: pr } = context.payload as PullRequestEvent

  const comments = await octokit.rest.issues.listComments({
    issue_number: pr.number,
    repo: context.repo.repo,
    owner: context.repo.owner,
  })

  const prev = comments.data.find((item) =>
    item.body?.endsWith(footer + commentId),
  )
  if (prev) {
    await octokit.rest.issues.updateComment({
      comment_id: prev.id,
      repo: context.repo.repo,
      owner: context.repo.owner,
      body,
    })
  } else {
    await octokit.rest.issues.createComment({
      issue_number: pr.number,
      body,
      repo: context.repo.repo,
      owner: context.repo.owner,
    })
  }
}
