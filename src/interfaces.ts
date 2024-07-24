interface RMOAIssue {
  code: string
  message: string
  path: string[]
  severity: number
  source: string
  range: {
    start: {
      line: number
      character: number
    }
    end: {
      line: number
      character: number
    }
  }
}

export interface APIResponse {
  results: {
    simpleReport: {
      version: string
      title: string
      fileExtension: 'json' | 'yaml'
      docsScore: number
      completenessScore: number
      score: number
      securityScore: number
      sdkGenerationScore: number
      shortSummary: string
      longSummary: string
    }
    fullReport: {
      issues: RMOAIssue[]
      docsIssues: RMOAIssue[]
      completenessIssues: RMOAIssue[]
      sdkGenerationIssues: RMOAIssue[]
      securityIssues: RMOAIssue[]
    }
  }
  reportId: string
  reportUrl: string
}
