import * as core from '@actions/core'
import { context } from '@actions/github'
import glob from 'glob'
import { createComment } from './comment'
import { parsePlan, parsePlanFile } from './parsePlan'

async function run(): Promise<void> {
  if (!context.payload.pull_request) {
    return
  }
  try {
    const token = core.getInput('token', { required: true })
    const path = core.getInput('path')
    const plan = core.getInput('plan')

    if (!path && !plan) {
      throw new Error('Either `path` or `plan` must be set.')
    }

    let comment: string

    if (path) {
      const paths = glob.sync(path, { nodir: true })
      comment = paths.reduce((acc, file) => acc + parsePlanFile(file), '')
    } else {
      comment = parsePlan(context.repo.repo, plan)
    }

    await createComment(token, comment)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
