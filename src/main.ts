import * as core from '@actions/core'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { lookup } from 'mime-types'
import { APIResponse } from './interfaces'
import { ApiError } from '@zuplo/errors'

const failMark = '\x1b[31m✖\x1b[0m'

function generateScoreTableRow(
  categoryName: string,
  score: number,
  numIssues: number
): string {
  return `<tr style="border:none">
      <td style="border:none">
        <img src="https://api.ratemyopenapi.com/svg-generator?score=${score}" width="100px" style="width:100px;"/>
      </td>
      <td style="border:none">
        <p><h3>${categoryName}</h3><span>${numIssues} issues</span></p>
      </td>
    </tr>`
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const openApiFilePath: string = core.getInput('filepath')
    const apikey: string = core.getInput('apikey')
    const maxWarnings: number | undefined = core.getInput('max-warnings')
      ? parseInt(core.getInput('max-warnings'), 10)
      : undefined
    const maxErrors: number | undefined = core.getInput('max-errors')
      ? parseInt(core.getInput('max-errors'), 10)
      : undefined
    const minimumScore: number = core.getInput('minimum-score')
      ? parseInt(core.getInput('minimum-score'), 10)
      : 80

    if (!existsSync(openApiFilePath)) {
      core.setFailed(
        `The OpenAPI file path provided does not exist: ${openApiFilePath}. Please specify an existing OpenAPI file and try again.`
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
            Authorization: `Bearer ${apikey}`,
            'User-Agent': 'rmoa-gh-action-v1'
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
        core.info(
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
        .addRaw(
          `<p align="center" style="margin-top:20px;margin-bottom:20px;">`
        )
        .addRaw(
          `The overall score is <strong>${report.results.simpleReport.score}</strong>. The following table provides a breakdown of the lint results per category for <strong>${openApiFilePath}</strong>.\n`
        )
        .addRaw('</p>')

      summary
        .addRaw(
          '<table align="center" style="border-collapse: collapse; border: none;">'
        )
        .addRaw(
          generateScoreTableRow(
            'Docs',
            report.results.simpleReport.docsScore,
            report.results.fullReport.docsIssues.length
          )
        )
        .addRaw(
          generateScoreTableRow(
            'Completeness',
            report.results.simpleReport.completenessScore,
            report.results.fullReport.completenessIssues.length
          )
        )
        .addRaw(
          generateScoreTableRow(
            'SDK Generation',
            report.results.simpleReport.sdkGenerationScore,
            report.results.fullReport.sdkGenerationIssues.length
          )
        )
        .addRaw(
          generateScoreTableRow(
            'Security',
            report.results.simpleReport.securityScore,
            report.results.fullReport.securityIssues.length
          )
        )
        .addRaw('</table>')

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

      if (maxWarnings && totalWarnings > maxWarnings) {
        core.setFailed(
          `The total number of warnings (${totalWarnings}) exceeds the maximum amout of warnings allowed (${maxWarnings})`
        )
      }

      if (maxErrors && totalErrors > maxErrors) {
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
