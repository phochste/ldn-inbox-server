const fs = require('fs');
const { JSONPath } = require('jsonpath-plus');
const logger = require('../../lib/util.js').getLogger();

/**
 * Demonstration event log handler
 */
async function handle({path,options,config,notification}) {
    const eventlog = options['eventlog'];

    if (!eventlog) {
        logger.error(`no eventlog option available (do you run valid_eventlog first?)`);
        return { path, options, success: false };
    }

    try {
        const meta = parseAsJSON(`${eventlog['path']}.meta`);
     
        const timemap = JSONPath({ path: '$.object.id' , json: notification });
        const relation = `<${timemap}> ; rel="timemap"`;

        let links = meta['Link'] || [];
        
        if (links.includes(relation)) {
            // Do nothing
        }        
        else {
            links.push(`<${timemap}> ; rel="timemap"`);
        }

        meta['Link'] = links;

        logger.info(`Writing ${meta['Link']} to ${eventlog['path']}.meta`);

        fs.writeFileSync(`${eventlog['path']}.meta`,JSON.stringify(meta,null,4));
        
        return { path, options, success: true };
    }
    catch(e) {
        logger.error(`failed to process ${path}`);
        logger.error(e);
        return { path, options, success: false };
    }
}

module.exports = { handle };