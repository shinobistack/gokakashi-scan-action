# GoKakashi Scan Action

This GitHub Action allows you to scan images on demand, store the reports, and log the report URL in your CI/CD pipeline for vulnerabilities using GoKakashi.

## Features

- On-demand scanning of Docker images
- Customizable severity reporting and job failure conditions
- Support for Cloudflare Access protected APIs
- Automatic retrying with exponential backoff

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|-------|
| `api_host` | The base URL of the GoKakashi API | Yes | N/A |
| `api_token` | API token for authentication with GoKakashi | Yes | N/A |
| `image_name` | The Docker image to scan | Yes | N/A |
| `severity` | Comma-separated list of severity levels to report | Yes | 'CRITICAL' |
| `publish` | The publish path for the scan report | No | N/A |
| `fail_on_severity` | Comma-separated list of severity levels to fail the job on | No | 'CRITICAL' |
| `cf_access_client_id` | Cloudflare Access Client ID | No | N/A |
| `cf_access_client_secret` | Cloudflare Access Client Secret | No | N/A |

**Note:** Valid severity levels are 'CRITICAL', 'HIGH', 'MEDIUM', and 'LOW'.

## Outputs

| Name | Description |
|------|-------------|
| `report_url` | URL of the scan report |

## Usage

Here's a basic example of how to use this action in your workflow:

```yaml
name: Scan Docker Image

on: [push]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

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

## Advanced Usage with Cloudflare Access

If your GoKakashi API is protected by Cloudflare Access, you can use the following configuration:

```yaml
- name: Scan Docker image (with Cloudflare Access)
  uses: gokakashi/gokakashi-scan-action@v1
  with:
    api_host: 'https://api.gokakashi.com'
    api_token: ${{ secrets.GOKAKASHI_API_TOKEN }}
    image_name: 'myorg/myimage:latest'
    severity: 'CRITICAL,HIGH,MEDIUM'
    publish: 'report_public'
    fail_on_severity: 'CRITICAL,HIGH'
    cf_access_client_id: ${{ secrets.CF_ACCESS_CLIENT_ID }}
    cf_access_client_secret: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}
```
Refer [user.yaml](user.yaml)

## Security

Please ensure that you store sensitive information like API tokens and Cloudflare Access credentials as [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

## Error Handling

The action will fail if:
- The scan fails to complete within the expected time
- Vulnerabilities are found that match the `fail_on_severity` levels

## Contributing

Contributions to improve the GoKakashi Scan Action are welcome. Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

This action is maintained by the GoKakashi team. For questions or support, please open an issue in the GitHub repository.