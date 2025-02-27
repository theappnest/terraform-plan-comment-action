import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { sep } from 'path'
import { DefaultArtifactClient } from '@actions/artifact'

export async function download(name: string): Promise<string> {
  const dir = mkdtempSync(`${tmpdir()}${sep}`)
  const artifact = new DefaultArtifactClient()

  // Fetch list of artifacts for the current workflow run
  const artifactResponse = await artifact.listArtifacts()
  const { artifacts } = artifactResponse

  // Find artifact ID based on name
  const matchingArtifact = artifacts.find((a) => a.name === name)
  if (!matchingArtifact) {
    throw new Error(`Artifact with name "${name}" not found`)
  }

  // Download using the artifact ID
  await artifact.downloadArtifact(matchingArtifact.id, {
    path: dir,
  })

  return dir
}
