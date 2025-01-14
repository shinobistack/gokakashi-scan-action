/******/ var __webpack_modules__ = ({

/***/ 859:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 577:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


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
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __nccwpck_require__(859);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __nccwpck_require__(577);




const interval = parseInt(_actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('interval') || '10', 10);
const retries = parseInt(_actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('retries') || '10', 10);

if (!Number.isInteger(interval) || interval <= 0) {
    throw new Error('Invalid interval. It must be a positive integer.');
}
if (!Number.isInteger(retries) || retries <= 0) {
    throw new Error('Invalid retries. It must be a positive integer.');
}



(async () => {
    try {
        // Inputs
        const image = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('image');
        const policy = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('policy');
        const server = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('server');
        const token = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('token');
        const cfClientID = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('cf_client_id');
        const cfClientSecret = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('cf_client_secret');
        const scanIdInput = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('scan_id');
        const interval = parseInt(_actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('interval') || '10');
        const retries = parseInt(_actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('retries') || '10');
        const gokakashiVersion = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('gokakashi_version') || 'v0.1.0';

        let scanId = scanIdInput;

        // Environment variables for headers
        const envVars = {
            CF_ACCESS_CLIENT_ID: cfClientID || '',
            CF_ACCESS_CLIENT_SECRET: cfClientSecret || ''
        };

        // Pull the gokakashi version
        _actions_core__WEBPACK_IMPORTED_MODULE_0__.info(`Pulling gokakashi version: ${gokakashiVersion}`);
        await _actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec(`docker pull ghcr.io/shinobistack/gokakashi:${gokakashiVersion}`);

        // Trigger a new scan if image and policy are provided
        if (image && policy) {
            _actions_core__WEBPACK_IMPORTED_MODULE_0__.info(`Triggering scan for image: ${image} with policy: ${policy}`);
            const output = [];

            await _actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec(
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
                _actions_core__WEBPACK_IMPORTED_MODULE_0__.info(`Scan triggered successfully. scanID: ${scanId}`);
            } else {
                throw new Error('Failed to parse scan ID from response.');
            }
        }

        if (!scanId) {
            throw new Error('No scan ID provided or generated.');
        }

        const scanUrl = `${server}/api/v1/scans/${scanId}`;
        _actions_core__WEBPACK_IMPORTED_MODULE_0__.info(`Scan details can be fetched at: ${scanUrl}`);

        //Check scan status
        let status = '';
        for (let attempt = 1; attempt <= retries; attempt++) {
            _actions_core__WEBPACK_IMPORTED_MODULE_0__.info(`Checking scan status (Attempt ${attempt}/${retries})...`);
            const output = [];

            await _actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec(
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
            _actions_core__WEBPACK_IMPORTED_MODULE_0__.info(`Scan status response: ${response}`);

            const statusMatch = response.match(/status: ([\w-]+)/);

            if (statusMatch) {
                status = statusMatch[1];
                if (status === 'success') {
                    _actions_core__WEBPACK_IMPORTED_MODULE_0__.info('Scan completed successfully.');
                    break;
                } else if (status === 'error') {
                    throw new Error('Scan failed. Check logs for details.');
                }
            } else {
                _actions_core__WEBPACK_IMPORTED_MODULE_0__.warning('Failed to parse status from response. Retrying...');
            }

            await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        }

        if (status !== 'success') {
            _actions_core__WEBPACK_IMPORTED_MODULE_0__.error(`Scan failed to complete successfully. Last known status: ${status}`);
            throw new Error('Scan did not complete successfully within the retry limit.');
        }

        // Output the scan URL
        _actions_core__WEBPACK_IMPORTED_MODULE_0__.setOutput('report_url', scanUrl);
    } catch (error) {
        _actions_core__WEBPACK_IMPORTED_MODULE_0__.setFailed(error.message);
    }
})();

