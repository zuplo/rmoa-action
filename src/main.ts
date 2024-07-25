import * as core from '@actions/core'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { lookup } from 'mime-types'
import { APIResponse } from './interfaces'
import { ApiError } from '@zuplo/errors'

const failMark = '\x1b[31m✖\x1b[0m'
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const openApiFilePath: string = core.getInput('filepath')
    const apikey: string = core.getInput('apikey')
    const maxWarnings: number = core.getInput('max-warnings')
      ? parseInt(core.getInput('max-warnings'), 10)
      : 5
    const maxErrors: number = core.getInput('max-errors')
      ? parseInt(core.getInput('max-errors'), 10)
      : 0
    const minimumScore: number = core.getInput('minimum-score')
      ? parseInt(core.getInput('minimum-score'), 10)
      : 80

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

      let totalErrors = 0
      let totalWarnings = 0
      try {
        for (const issue of report.results.fullReport.issues) {
          core.debug(`${openApiFilePath}`)

          if (issue.severity === 0) {
            totalErrors++
            core.error(issue.message, {
              file: openApiFilePath,
              startLine: issue.range.start.line,
              startColumn: issue.range.start.character,
              endLine: issue.range.end.line,
              endColumn: issue.range.end.character
            })
          } else {
            totalWarnings++
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

      if (totalErrors > 0 || totalWarnings > 0) {
        const totalProblems = totalErrors + totalWarnings
        core.debug(
          `${failMark} ${totalProblems} problems (${totalErrors} errors, ${totalWarnings} warnings)`
        )
      }

      const summary = core.summary.addHeading(`RMOA lint report`, 2)
      summary
        .addRaw('<p align="center">')
        .addRaw(
          `<img src="https://api.ratemyopenapi.com/svg-generator?score=${report.results.simpleReport.score}" width="150px" style="width:150px;" alt="Overall score is ${report.results.simpleReport.score}"/>`
        )
        .addRaw('</p>')
        .addRaw(`<p style="margin-top:20px;">`)
        .addRaw(
          `The overall score is <strong>${report.results.simpleReport.score}</strong>. The following table provides a breakdown of the lint results per category for <strong>${openApiFilePath}</strong>.\n`
        )
        .addRaw('</p>')

      summary.addRaw(
        `<div style="width:100%;height:100px;"><div style="width:50%;display:inline-block;height:100%;"><img src="https://api.ratemyopenapi.com/svg-generator?score=${report.results.simpleReport.docsScore}" width="100px" style="width:100px;"/></div> <div style="width:30%;display:inline-block;height:100%;font-size:15px;margin-top:25px"><h3>Docs<h3/><p>${report.results.fullReport.docsIssues.length}</p></div>`
      )

      summary.addRaw(`<div style="display: flex; align-items: center;">
  <img src="https://api.ratemyopenapi.com/svg-generator?score=${report.results.simpleReport.docsScore}" width="100px" style="width:100px;"/>
  <p>This is a paragraph next to the image. You can add more text here as needed. The image and the paragraph are displayed side by side.</p>
</div>`)

      summary.addRaw(`<table>
  <tr>
    <td>
      <img src="https://api.ratemyopenapi.com/svg-generator?score=${report.results.simpleReport.docsScore}" width="100px" style="width:100px;"/>
    </td>
    <td>
      <p>This is a paragraph next to the image. You can add more text here as needed. The image and the paragraph are displayed side by side.</p>
    </td>
  </tr>
</table>`)

      /*
      summary
        .addRaw('<p align="center" style="text-align:center;">')
        .addTable([
          [
            {
              data: `<img src="https://api.ratemyopenapi.com/svg-generator?score=${report.results.simpleReport.docsScore}" width="100px" style="width:100px;"/>`,
              header: true
            },
            {
              data: `<img src="https://api.ratemyopenapi.com/svg-generator?score=${report.results.simpleReport.completenessScore}" width="100px" style="width:100px;"/>`,
              header: true
            },
            {
              data: `<img src="https://api.ratemyopenapi.com/svg-generator?score=${report.results.simpleReport.sdkGenerationScore}" width="100px" style="width:100px;"/>`,
              header: true
            },
            {
              data: `<img src="https://api.ratemyopenapi.com/svg-generator?score=${report.results.simpleReport.securityScore}" width="100px" style="width:100px;"/>`,
              header: true
            }
          ],
          [
            { data: 'Docs' },
            { data: 'Completeness' },
            { data: 'SDK Generation' },
            { data: 'Security' }
          ]
        ])
        .addRaw('</p>')
*/
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
        .addDetails('Summary', report.results.simpleReport.shortSummary)
        .addDetails('Advice', report.results.simpleReport.longSummary)
        .addRaw('</p>')

      summary.addBreak()
      summary.addRaw(
        `View details of your report at <a href="${report.reportUrl}">${report.reportUrl}</a>.\n`
      )

      await summary.write()

      if (totalWarnings > maxWarnings) {
        core.setFailed(
          `The total number of warnings (${totalWarnings}) exceeds the maximum amout of warnings allowed (${maxWarnings})`
        )
      }

      if (totalErrors > maxErrors) {
        core.setFailed(
          `The total number of errors (${totalErrors}) exceeds the maximum amout of errors allowed (${maxErrors})`
        )
      }

      if (minimumScore > report.results.simpleReport.score) {
        core.setFailed(
          `The minimum passing score is '${minimumScore}' and the lint score for this run is '${report.results.simpleReport.score}'`
        )
      }
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
