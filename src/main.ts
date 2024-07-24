import * as core from '@actions/core'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { lookup } from 'mime-types'
import { APIResponse } from './interfaces'
import { ApiError } from '@zuplo/errors'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const openApiFilePath: string = core.getInput('filepath')
    const apikey: string = core.getInput('apikey')

    if (!existsSync(openApiFilePath)) {
      core.setFailed(
        `The Open API file path provided does not exist: ${openApiFilePath}. Please specify an existing Open API file and try again.`
      )
    }

    // Read the file as a buffer
    const data = await readFile(openApiFilePath, 'utf-8')

    // Convert the buffer to a Blob
    const lookuptMimeType = lookup(openApiFilePath)
    const file = new Blob([data], {
      type: typeof lookuptMimeType === 'string' ? lookuptMimeType : undefined
    })
    const formData = new FormData()
    formData.set('apiFile', file, openApiFilePath)

    try {
      const fileUploadResults = await fetch(
        `https://api.ratemyopenapi.com/sync-report`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${apikey}`
          }
        }
      )

      if (fileUploadResults.status !== 200) {
        const error = (await fileUploadResults.json()) as ApiError
        core.setFailed(`${error.detail ?? error.message}`)
      }

      const report = (await fileUploadResults.json()) as APIResponse

      try {
        for (const issue of report.results.fullReport.issues) {
          core.debug(`${openApiFilePath}`)

          if (issue.severity === 0) {
            core.error(issue.message, {
              file: openApiFilePath,
              startLine: issue.range.start.line,
              startColumn: issue.range.start.character,
              endLine: issue.range.end.line,
              endColumn: issue.range.end.character
            })
          } else {
            core.warning(issue.message, {
              file: openApiFilePath,
              startLine: issue.range.start.line,
              startColumn: issue.range.start.character,
              endLine: issue.range.end.line,
              endColumn: issue.range.end.character
            })
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          core.setFailed(
            `Failed to parse OpenAPI lint results. Error: ${error.message}`
          )
        } else {
          core.setFailed(
            `Failed to parse OpenAPI lint results. Error: ${error as string}`
          )
        }
      }

      // @TODO better summary

      const summary = core.summary.addHeading(`Results for: ${openApiFilePath}`)
      summary.addTable([
        [
          { data: 'Overall', header: true },
          { data: 'Docs', header: true },
          { data: 'Completeness', header: true },
          { data: 'SDK Generation', header: true },
          { data: 'Security', header: true }
        ],
        [
          { data: report.results.simpleReport.score.toString() },
          { data: report.results.simpleReport.docsScore.toString() },
          { data: report.results.simpleReport.completenessScore.toString() },
          { data: report.results.simpleReport.sdkGenerationScore.toString() },
          { data: report.results.simpleReport.securityScore.toString() }
        ]
      ])

      summary.addRaw(
        `View details of your report at [${report.reportUrl}](${report.reportUrl})\n`
      )

      await summary.write()
    } catch (error) {
      if (error instanceof Error) {
        core.setFailed(`fail: ${error.message}`)
      } else {
        core.setFailed(`fail: ${error as string}`)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`fail: ${error.message}`)
    } else {
      core.setFailed(`fail: ${error as string}`)
    }
  }
}
