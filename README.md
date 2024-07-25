# Rate My OpenAPI GitHub Action

This action provides the following functionality for GitHub Actions users:

- Run the Rate My OpenAPI rules on an OpenAPI spec file
- Get a summary of the the RMOA score in the action output
- Get annotations on the OpenAPI spec file per run

## Usage

See [action.yml](action.yml)

<!-- start usage -->

```yaml
- uses: zuplo/ramoa-action@v1
  with:
    # File containing the OpenAPI Spec to be linted.  Examples: my-api.oas.json, api-spec.yaml
    filepath: ''

    # The RMOA API Key issued when creating a user on https://api.ratemyopenapi.com/docs
    apikey: ''

    # The maximum number of warnings allowed before labeling the run as failed. Default is 5.
    max-warnings: ''

    # The maximum number of errors allowed before labeling the run as failed. Default is 0.
    max-errors: ''

    # The minimum score (0 - 100) to label a lint run as successful/passing. Default is 80.
    minimum-score: ''
```

<!-- end usage -->

## License

The scripts and documentation in this project are released under the
[MIT License](LICENSE)

## Contributions

Contributions are welcome!
