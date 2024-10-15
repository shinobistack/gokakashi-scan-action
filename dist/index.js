/******/ var __webpack_modules__ = ({

/***/ 859:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 77:
/***/ ((module) => {

module.exports = eval("require")("node-fetch");


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
/* harmony import */ var node_fetch__WEBPACK_IMPORTED_MODULE_0__ = __nccwpck_require__(77);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_1__ = __nccwpck_require__(859);



const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeRequest(url, options) {
    try {
        const response = await node_fetch__WEBPACK_IMPORTED_MODULE_0__(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Request failed: ${error.message}`);
        throw error;
    }
}

async function pollScanStatus(apiHost, apiToken, scanId, headers ) {
    let status = 'queued';
    let retries = 0;
    const maxRetries = 30;
    const initialDelay = 10000;

    while ((status === 'queued' || status === 'in-progress') && retries < maxRetries) {
        console.log(`Current scan status: ${status}. Waiting for completion...`);

        await sleep(initialDelay * Math.pow(2, retries));

        const statusData = await makeRequest(`${apiHost}/api/v0/scan/${scanId}/status`, {
            method: 'GET',
            headers: headers,
        });
        console.log(statusData)
        status = statusData.status;
        retries++;

        if (status === 'completed') {
            return statusData.report_url[0];
        }
    }

    throw new Error(`Scan did not complete within the expected time. Final status: ${status}`);
}

async function run() {
    try {
        const apiHost = (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.getInput)('api_host');
        const apiToken = (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.getInput)('api_token');
        const imageName = (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.getInput)('image_name');
        const severity = (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.getInput)('severity');
        const publish = (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.getInput)('publish');
        const failOnSeverity = (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.getInput)('fail_on_severity');
        const cfClientId = (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.getInput)('cf_access_client_id') || '';
        const cfClientSecret = (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.getInput)('cf_access_client_secret') || '';
        console.log(`API Host: ${apiHost}`);
        console.log(`API Token: ${apiToken}`);
        console.log(`Image Name: ${imageName}`);

        // Validate inputs
        if (!apiHost || !apiToken || !imageName) {
            throw new Error('Missing required inputs: api_host, api_token, or image_name');
        }

        // Create headers object with optional Cloudflare headers
        const headers = {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        };

        // Add Cloudflare headers only if both are provided
        if (cfClientId && cfClientSecret) {
            headers['CF-Access-Client-Id'] = cfClientId;
            headers['CF-Access-Client-Secret'] = cfClientSecret;
        }

        console.log('Triggering scan...');
        const triggerData = await makeRequest(`${apiHost}/api/v0/scan?image=${imageName}&severity=${severity}&publish=${publish}`, {
            method: 'POST',
            headers: headers,
        });

        const scanId = triggerData.scan_id;
        console.log(`Scan triggered with scan ID: ${scanId}`);

        const reportUrl = await pollScanStatus(apiHost, apiToken, scanId, headers);
        console.log(`Scan completed. Report URL: ${reportUrl}`);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.setOutput)('report_url', reportUrl);

        if (failOnSeverity) {
            console.log('Fetching scan report...');
            const reportData = await makeRequest(reportUrl);

            const severitiesToFailOn = failOnSeverity.split(',').map(sev => sev.trim().toUpperCase());
            const hasVulnsToFail = reportData.vulnerabilities.some(vuln =>
                severitiesToFailOn.includes(vuln.severity)
            );
            if (hasVulnsToFail) {
                (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.setFailed)(`Vulnerabilities found with severity: ${severitiesToFailOn.join(', ')}`);
            } else {
                console.log(`No vulnerabilities found with severity: ${severitiesToFailOn.join(', ')}`);
            }
        } else {
            console.log('No fail_on_severity defined, proceeding without failing the job.');
        }
    } catch (error) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__.setFailed)(`Action failed: ${error.message}`);
    }
}

run();
