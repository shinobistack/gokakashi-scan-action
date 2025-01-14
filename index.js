const core = require('@actions/core');
const exec = require('@actions/exec');

(async () => {
    try {
        // Inputs
        const image = core.getInput('image');
        const policy = core.getInput('policy');
        const server = core.getInput('server');
        const token = core.getInput('token');
        const cfClientID = core.getInput('cf_client_id');
        const cfClientSecret = core.getInput('cf_client_secret');
        const scanIdInput = core.getInput('scan_id');
        const interval = parseInt(core.getInput('interval') || '10');
        const retries = parseInt(core.getInput('retries') || '10');
        const gokakashiVersion = core.getInput('gokakashi_version') || 'v0.1.0';

        let scanId = scanIdInput;

        // Environment variables for headers
        const envVars = {
            CF_ACCESS_CLIENT_ID: cfClientID || '',
            CF_ACCESS_CLIENT_SECRET: cfClientSecret || ''
        };

        // Pull the gokakashi version
        core.info(`Pulling gokakashi version: ${gokakashiVersion}`);
        await exec.exec(`docker pull ghcr.io/shinobistack/gokakashi:${gokakashiVersion}`);

        // Trigger a new scan if image and policy are provided
        if (image && policy) {
            core.info(`Triggering scan for image: ${image} with policy: ${policy}`);
            const output = [];

            await exec.exec(
                `docker run --rm --env CF_ACCESS_CLIENT_ID=${cfClientID} --env CF_ACCESS_CLIENT_SECRET=${cfClientSecret} ghcr.io/shinobistack/gokakashi:${gokakashiVersion}`,
                [
                    'scan',
                    'image',
                    `--image=${image}`,
                    `--policy=${policy}`,
                    `--server=${server}`,
                    `--token=${token}`
                ],
                {
                    listeners: {
                        stdout: (data) => {
                            output.push(data.toString());
                        }
                    }
                }
            );

            const response = output.join('').trim();
            const match = response.match(/scanID: ([\w-]+)/);

            if (match) {
                scanId = match[1];
                core.info(`Scan triggered successfully. scanID: ${scanId}`);
            } else {
                throw new Error('Failed to parse scan ID from response.');
            }
        }

        if (!scanId) {
            throw new Error('No scan ID provided or generated.');
        }

        const scanUrl = `${server}/api/v1/scans/${scanId}`;
        core.info(`Scan details can be fetched at: ${scanUrl}`);

        //Check scan status
        let status = '';
        for (let attempt = 1; attempt <= retries; attempt++) {
            core.info(`Checking scan status (Attempt ${attempt}/${retries})...`);
            const output = [];

            await exec.exec(
                `docker run --rm --env CF_ACCESS_CLIENT_ID=${cfClientID} --env CF_ACCESS_CLIENT_SECRET=${cfClientSecret} ghcr.io/shinobistack/gokakashi:${gokakashiVersion}`,
                [
                    'scan',
                    'status',
                    `--scanID=${scanId}`,
                    `--server=${server}`,
                    `--token=${token}`
                ],
                {
                    listeners: {
                        stdout: (data) => {
                            output.push(data.toString());
                        }
                    }
                }
            );

            const response = output.join('').trim();
            core.info(`Scan status response: ${response}`);

            const statusMatch = response.match(/status: ([\w-]+)/);

            if (statusMatch) {
                status = statusMatch[1];
                if (status === 'success') {
                    core.info('Scan completed successfully.');
                    break;
                } else if (status === 'error') {
                    throw new Error('Scan failed. Check logs for details.');
                }
            } else {
                core.warning('Failed to parse status from response. Retrying...');
            }

            await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        }

        if (status !== 'success') {
            throw new Error('Scan did not complete successfully within the retry limit.');
        }

        // Output the scan URL
        core.setOutput('report_url', scanUrl);
    } catch (error) {
        core.setFailed(error.message);
    }
})();
