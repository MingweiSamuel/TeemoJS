// This file creates defaultConfig.json
// This is not meant to be `require`d in a project.
const Promise = require("bluebird");
const fetch = require("node-fetch");
const fs = Promise.promisifyAll(require("fs"));
const { JSDOM } = require("jsdom");

let defaultConfig = JSON.parse(JSON.stringify(require('./emptyConfig.json')));

function camelCase(...tokens) {
  return [
    tokens.shift(),
    ...tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1))
  ].join('');
}

async function main() {
  const res = await fetch('http://www.mingweisamuel.com/riotapi-schema/openapi-3.0.0.json');
  if (200 !== res.status)
    throw new Error(`Fetch failed: ${res.status}.`);

  const config = {};

  const { paths } = await res.json();
  for (let [ path, methodOperation ] of Object.entries(paths)) {
    path = path.replace('{encryptedSummonerId}', '{summonerId}')
      .replace('{encryptedAccountId}', '{accountId}')
      .replace('{encryptedPUUID}', '{puuid}');
    for (const [ method, operation ] of Object.entries(methodOperation)) {
      if (method.startsWith('x-'))
        continue;

      let [ endpoint, name ] = operation.operationId.split('.');
      endpoint = camelCase(...endpoint.split('-'));

      console.log(`${endpoint}:\t${method}\t${name}`);

      (config[endpoint] = config[endpoint] || {})[name] = {
        path,
        fetch: 'get' === method ? undefined : {
          method
        }
      };
    }
  }

  defaultConfig.endpoints = config;
  await fs.writeFileAsync('defaultConfig.json', JSON.stringify(defaultConfig, null, 2));
}

main().catch(console.err);
