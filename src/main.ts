import { join } from 'path'
import * as core from '@actions/core'
import { context } from '@actions/github'
import { createComment } from './comment'
import { download } from './download'
import { parsePlan, parsePlanDir } from './parsePlan'

async function run(): Promise<void> {
  try {
    if (!context.payload.pull_request) {
      throw new Error(`Unsupported event: ${context.eventName}`)
    }

    const token = core.getInput('token', { required: true })
    const name = core.getInput('name')
    const path = core.getInput('path')
    const plan = core.getInput('plan')
    const header = core.getInput('header')

    if (!name && !path && !plan) {
      throw new Error('Either `name`, `path` or `plan` must be set.')
    }

    let comment: string

    if (path) {
      comment = parsePlanDir(path)
    } else if (plan) {
      comment = parsePlan(context.repo.repo, plan)
    } else {
      const dir = await download(name)
      comment = parsePlanDir(join(dir, '**'), dir)
    }

    await createComment(token, comment, name, header)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
