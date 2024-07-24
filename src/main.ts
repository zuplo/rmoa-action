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

      const summary = core.summary.addHeading(`RMOA lint report`, 2)
      summary
        .addRaw(`<p>`)
        .addRaw(
          `The overall score is <strong>${report.results.simpleReport.score}</strong>. The following table provides a breakdown of the lint results per category for <strong>${openApiFilePath}</strong>.\n`
        )
        .addRaw('</p>')

      summary
        .addRaw('<p>')
        .addTable([
          [
            { data: 'Category', header: true },
            { data: 'Score', header: true },
            { data: 'Issues', header: true }
          ],
          [
            { data: 'Docs' },
            { data: report.results.simpleReport.docsScore.toString() },
            { data: report.results.fullReport.docsIssues.length.toString() }
          ],
          [
            { data: 'Completeness' },
            { data: report.results.simpleReport.completenessScore.toString() },
            {
              data: report.results.fullReport.completenessIssues.length.toString()
            }
          ],
          [
            { data: 'SDK Generation' },
            { data: report.results.simpleReport.sdkGenerationScore.toString() },
            {
              data: report.results.fullReport.sdkGenerationIssues.length.toString()
            }
          ],
          [
            { data: 'Security' },
            { data: report.results.simpleReport.securityScore.toString() },
            { data: report.results.fullReport.securityIssues.length.toString() }
          ]
        ])
        .addRaw('</p>')

      summary
        .addRaw('<p> ')
        .addRaw(report.results.simpleReport.shortSummary)
        .addBreak()
        .addDetails('Advice', report.results.simpleReport.longSummary)
        .addRaw('</p>')

      summary.addBreak()
      summary.addRaw(
        `View details of your report at <a href="${report.reportUrl}">${report.reportUrl}</a>.\n`
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
