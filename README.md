# rmoa-action

<p align="center">
  <a href="https://ratemyopenapi.com/">
    <img src="https://cdn.zuplo.com/static/logos/logo.svg" height="50">
    <h3 align="center">Rate My Open API</h3>
  </a>
</p>

rmoa-action analyzes an OpenAPI definition file using the Rate My OpenAPI API,
and reports the issues as console output, annotations and action summary.

The goal of rmoa-action is to help you establish best practices for your
OpenAPI's definitions across multiple categories that include security,
documentation and more.

This action provides the following functionality for GitHub Actions users:

- Run the Rate My OpenAPI rules on an OpenAPI spec file
- Get a summary of the the RMOA score in the action output
- Get annotations on the OpenAPI spec file per run
- Get a link to a detailed report

## Usage

Lint & get a score for your OpenAPI definition. You'll need to create a free api
key at the [Rate My Open API Portal](https://api.ratemyopenapi.com/docs).

See [action.yml](action.yml)

<!-- start usage -->

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

<!-- end usage -->

**Basic:**

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: zuplo/rmoa-action@v1
    with:
      filepath: './my-api.json'
      apikey: ${{ secrets.RMOA_API_KEY }}
```

## License

The scripts and documentation in this project are released under the
[MIT License](LICENSE)

## Contributions

Contributions are welcome!
