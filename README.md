# rmoa-action

<p align="center">
  <a aria-label="Zuplo logo" href="https://zuplo.com">
    <img src="https://img.shields.io/badge/MADE%20BY%20Zuplo-FF00BD.svg?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAzNyAzMiIgYXJpYS1oaWRkZW49InRydWUiPgogIDxwYXRoIGZpbGw9IiNGRjAwQkQiIGQ9Ik0yNy4xNDIgMTkuOTc4SDE2LjYyTDI3LjgzIDguNzQ2YS43NTguNzU4IDAgMDAtLjUzNC0xLjI5M0g5LjQ4OFYwaDE5LjUzNGE3LjU3MyA3LjU3MyAwIDAxNC4wNjUgMS4xMjUgNy41OTEgNy41OTEgMCAwMTIuODM2IDMuMTI2IDcuNDAyIDcuNDAyIDAgMDEtMS40NjEgOC4zOThsLTcuMzIgNy4zMjh6Ii8+CiAgPHBhdGggZmlsbD0iI0ZGMDBCRCIgZD0iTTkuNDg5IDExLjA0MmgxMC41MjRsLTExLjE5IDExLjIxYS43NzIuNzcyIDAgMDAuNTQzIDEuMzE2aDE3Ljc1OXY3LjQ1Mkg3LjYxYTcuNTc0IDcuNTc0IDAgMDEtNC4wNjUtMS4xMjVBNy41OTMgNy41OTMgMCAwMS43MSAyNi43NjhhNy40MDMgNy40MDMgMCAwMTEuNDYyLTguMzk3bDcuMzE4LTcuMzI5eiIvPgo8L3N2Zz4K&labelColor=000"></a>
  <a aria-label="Join the community on Discord" href="https://discord.com/channels/848913990360629268/1235294876778627246"><img alt="Discrod Badge" src="https://img.shields.io/badge/Chat%20on%20discord-5865F2.svg?style=for-the-badge&logo=discord&labelColor=000000&logoWidth=20"></a>
</p>

At [Zuplo](https://www.zuplo.com) we believe that the better the quality of an
OpenAPI document, the better the developer experience will be for the consumers
of that API. This experience is important for the success of an API.

Rate My OpenAPI is a suite of tools designed to help software developers using
OpenAPI to meet high standards of quality and usability when designing and
developing their APIs.

rmoa-action is part of this suite of tools. It analyzes an OpenAPI definition
file using the Rate My OpenAPI API, and reports the issues as console output,
annotations and action summary.

The goal of rmoa-action is to help you establish best practices & continuous
quality monitoring for your OpenAPI's definitions by seamlessly integrating it
to your repository & development workflow.

### Categories of Evaluation

Our tools evaluate your OpenAPI definition files and provide a comprehensive
score based on four key categories:

- <b>Documentation:</b> Ensure your API is well-documented, making it easy for
  users to understand and use.
- <b>SDK Generation:</b> Verify that your API definition supports SDK
  generation, facilitating integration and usage in different programming
  languages.
- <b>Security:</b> Check for best practices and standards to ensure your API is
  secure and protected against common vulnerabilities.
- <b>Completeness:</b> Ensure your API definition is complete, with all
  necessary endpoints, parameters, and responses accurately defined.

### Features

This action provides the following functionality for GitHub Actions users:

- Run the Rate My OpenAPI rules on an OpenAPI spec file
- Get a summary of the the RMOA score in the action output
- Get annotations on the OpenAPI spec file per run
- Get a link to a detailed report

## Usage

To get started add our GitHub action to your repository & configure it to run on
Pull Requests and Pushes to ensure continuous quality monitoring.

### Getting an API Key

You will need an API key as the GitHub Action uses the Rate My OpenAPI APIs
which require the use of an API Key. You can sign up for free at
[https://api.ratemyopenapi.com/docs](https://api.ratemyopenapi.com/docs) to get
your API Key.

> CAUTION: All reports generated by Rate My OpenAPI are public (with an
> unguessable UUID URL), even if uploaded with an API Key. Anyone with the URL
> to your report will be able to access the report.

### Basic Setup

Lint an OpenAPI definition file using the default configuration

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: zuplo/rmoa-action@v1
    with:
      filepath: './my-api.json'
      apikey: ${{ secrets.RMOA_API_KEY }}
```

### Advanced Setup

Lint an OpenAPI definition and override the minimum passing score (default is 80
out of 100) and set the maximum number of allowed warnings & errors.

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: zuplo/rmoa-action@v1
    with:
      filepath: './my-api.json'
      apikey: ${{ secrets.RMOA_API_KEY }}
      max-errors: 0
      max-warnings: 5
      minimum-score: 70
```

**Configuration Options**

```yaml
- uses: zuplo/rmoa-action@v1
  with:
    # File containing the OpenAPI Spec to be linted.  Examples: my-api.oas.json, api-spec.yaml
    filepath: ''

    # The RMOA API Key issued when creating a user on https://api.ratemyopenapi.com/docs
    apikey: ''

    # The maximum number of warnings allowed before labeling the run as failed.
    max-warnings: ''

    # The maximum number of errors allowed before labeling the run as failed.
    max-errors: ''

    # The minimum score (0 - 100) to label a lint run as successful/passing. Default is 80.
    minimum-score: ''
```

### Private Setup

For private repos, this will only pass your OpenAPI spec on to `rmoa-action`
and not your entire repo.

```yaml
steps:
  - uses: actions/checkout@v4
    with:
      sparse-checkout: './my-api.json'
      sparse-checkout-cone-mode: false
  - uses: zuplo/rmoa-action@v1
    with:
      filepath: './my-api.json'
      apikey: ${{ secrets.RMOA_API_KEY }}
```

### Example

This example sets `rmoa-action` up in a workflow that will run on every pull
request created on the repository. The pull request cannot be merged until the
Open API specificaion in the `my-api.json` file reaches a minimum score of 80.

```yaml
on:
  pull_request:
    branches: [$default-branch]

jobs:
  rate-my-open-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: zuplo/rmoa-action@v1
        with:
          filepath: './my-api.json'
          apikey: ${{ secrets.RMOA_API_KEY }}
      - name: Rate My Open API
        run: rmoa lint
```

See [action.yml](action.yml)

## License

The scripts and documentation in this project are released under the
[MIT License](LICENSE)

## Contributions

Contributions are welcome!
