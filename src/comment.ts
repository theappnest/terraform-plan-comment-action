import { context, getOctokit } from '@actions/github'
import { PullRequestEvent } from '@octokit/webhooks-types'

export async function createComment(
  token: string,
  content: string,
  commentId: string,
  header: string,
): Promise<void> {
  const footer = `\n\n---\n\nThis comment was generated with [terraform-plan-comment](https://github.com/theappnest/terraform-plan-comment-action).<!-- CommentID: ${commentId} -->`

  const body = header + (content || `No changes detected.`) + footer

  const octokit = getOctokit(token)

  const { pull_request: pr } = context.payload as PullRequestEvent

  const comments = await octokit.rest.issues.listComments({
    issue_number: pr.number,
    repo: context.repo.repo,
    owner: context.repo.owner,
  })

  const prev = comments.data.find((item) => item.body?.endsWith(footer))
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
