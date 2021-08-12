import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { sep } from 'path'
import { create } from '@actions/artifact'

export async function download(name: string): Promise<string> {
  const dir = mkdtempSync(`${tmpdir()}${sep}`)
  const client = create()
  await client.downloadArtifact(name, dir)
  return dir
}
