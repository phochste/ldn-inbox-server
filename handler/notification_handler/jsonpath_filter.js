const { JSONPath } = require('jsonpath-plus');
const logger = require('../../lib/util.js').getLogger();

/**
 * Demonstration notification handler, that checks if the notification
 * matches a configurable list
 */
async function handle({path,options,config,notification}) {
    if (! config) {
        logger.error('no configuration found for eventlog_notification_handler');
        return { path, options, success: false };
    }

    if (! (config['anyOf'] && Array.isArray(config['anyOf']))) {
        logger.error('no anyOf entry in notification_handler.type_filer should be an array'); 
        return { path, options, success: false };
    }

    try {
        const anyOf = config['anyOf'];
        
        let isOk = false;

        for (let i = 0 ; i < anyOf.length ; i++) {
            let matchCount = 0;
            for (let j = 0 ; j < anyOf[i].length ; j++) {
                const anyPart = anyOf[i][j];
                const path  = anyPart['path'];
                const value = anyPart['value'];
                
                const jsonValue = JSONPath({ path: path, json: notification });

                if (jsonValue !== null || jsonValue !== undefined) {
                    if (Array.isArray(jsonValue)) {
                        if (jsonValue.includes(value)) {
                            // Yup ..
                            logger.info(`found ${path} includes ${value} `)
                            matchCount++;
                        }
                        else {
                            // Nope ..
                            logger.error(`found ${path} not includes ${value}`);
                        }
                    }
                    else if (typeof jsonValue === 'string' || typeof jsonValue === 'number') {
                        if (jsonValue === value) {
                            // Yup ..
                            logger.info(`found ${path} === ${value} `);
                            matchCount++
                        }
                        else {
                            // Nope ..
                            logger.error(`found ${path} !== ${value}`);
                        }
                    }
                    else {
                        // Nope ..
                        logger.error(`found ${path} unexpected value`);
                    }
                }
                else {
                    // Nope ..
                    logger.error(`no ${path} found`);
                }
            }
            if (matchCount == anyOf[i].length) {
                isOk = true;
                break;
            }
        }

        if (isOk) {
            return { path, options, success: true };
        }
        else {
            logger.error(`notification does not pass jsonpath_filter check`);
            return { path, options, success: false };
        }
    }
    catch(e) {
        logger.error(`failed to process ${path}`);
        logger.error(e);
        return { path, options, success: false };
    }
}

module.exports = { handle };