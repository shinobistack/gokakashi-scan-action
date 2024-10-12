# GoKakashi Scan Action

This GitHub Action allows you to scan images on demand and store the reports and log the report(s) URL in CICD for vulnerabilities using GoKakashi.

## Inputs

* `api_host`: The base URL of the GoKakashi API (required)
* `api_token`: API token for authentication with GoKakashi (required)
* `image_name`: The Docker image to scan (required)
* `severity`: Comma-separated list of severity levels to report (default: 'CRITICAL') (required)
* `publish`: The publish path for the scan report (default: 'report_private') 
* `fail_on_severity`: Comma-separated list of severity levels to fail the job on (default: 'CRITICAL')

## Outputs

* `report_url`: URL of the scan report

## Example usage

```yaml
name: Scan Docker Image

on: [push]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Scan Docker image
      uses: gokakashi/gokakashi-scan-action@v1
      with:
        api_host: 'https://api.gokakashi.com'
        api_token: ${{ secrets.GOKAKASHI_API_TOKEN }}
        image_name: 'myorg/myimage:latest'
        severity: 'HIGH,CRITICAL'
        fail_on_severity: 'CRITICAL'

    - name: Get the scan report URL
      run: echo "The scan report URL is ${{ steps.scan.outputs.report_url }}"
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Author
This action is maintained by the goKakashi team. For questions or support, please open an issue in the GitHub repository.