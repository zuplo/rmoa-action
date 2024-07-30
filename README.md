# rmoa-action

<p align="center">
  <a href="https://ratemyopenapi.com/">
    <img src="https://cdn.zuplo.com/static/logos/logo.svg" height="50">
    <h3 align="center">Rate My Open API</h3>
  </a>
</p>

At Zuplo we believe that the better the quality of an OpenAPI document, the
better the developer experience will be for the consumers of that API. This
experience is important for the success of an API.

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
(https://api.ratemyopenapi.com/docs)[https://api.ratemyopenapi.com/docs] to get
your API Key.

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

See [action.yml](action.yml)

## License

The scripts and documentation in this project are released under the
[MIT License](LICENSE)

## Contributions

Contributions are welcome!
