// This file creates defaultConfig.json
// This is not meant to be `require`d in a project.
const fetch = require("node-fetch");
const { writeFile } = require("fs");
const writeFileAsync = require("util").promisify(writeFile);

const overrides = {
  "*": {
    "regionTable": {
      "br": "br1",
      "eune": "eun1",
      "euw": "euw1",
      "jp": "jp1",
      "kr": "kr",
      "lan": "la1",
      "las": "la2",
      "na": "na1",
      "oce": "oc1",
      "tr": "tr1",
      "ru": "ru",
      "pbe": "pbe1"
    }
  },
  "tft": {
    "matchV1": {
      "*": {
        "regionTable": {
          "br": "americas",
          "eune": "europe",
          "euw": "europe",
          "jp": "asia",
          "kr": "asia",
          "lan": "americas",
          "las": "americas",
          "na": "americas",
          "oce": "americas",
          "tr": "europe",
          "ru": "europe",
          "pbe": "americas",
          "americas": "americas",
          "europe": "europe",
          "asia": "asia"
        }
      }
    }
  },
  "tournament": {
    "*": {
      "regionTable": {
        "br": "americas",
        "eune": "americas",
        "euw": "americas",
        "jp": "americas",
        "kr": "americas",
        "lan": "americas",
        "las": "americas",
        "na": "americas",
        "oce": "americas",
        "tr": "americas",
        "ru": "americas",
        "pbe": "americas",
        "americas": "americas"
      }
    }
  }
};

const defaultConfig = require('../config/empty.json');

function camelCase(...tokens) {
  return tokens.shift() + tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('');
}

async function main() {
  const res = await fetch('http://www.mingweisamuel.com/riotapi-schema/openapi-3.0.0.json');
  if (200 !== res.status)
    throw new Error(`Fetch failed: ${res.status}.`);

  const endpoints = {};

  const { paths } = await res.json();
  for (let [ path, methodOperation ] of Object.entries(paths)) {
    path = path.replace('{encryptedSummonerId}', '{summonerId}')
      .replace('{encryptedAccountId}', '{accountId}')
      .replace('{encryptedPUUID}', '{puuid}');
    for (const [ method, operation ] of Object.entries(methodOperation)) {
      if (method.startsWith('x-'))
        continue;

      let topLayer = 'lol'; // 'lol', 'tft', or 'tournament'.
      let [ endpoint, name ] = operation.operationId.split('.');
      const endpointSegments = endpoint.split('-');
      if ([ 'tft', 'tournament', 'lol' ].includes(endpointSegments[0]))
        topLayer = endpointSegments.shift();
      endpoint = camelCase(...endpointSegments);

      console.log(`${topLayer.padEnd(10)} ${endpoint.padEnd(20)} ${name.padEnd(30)} (${method})`);

      let layer = endpoints;
      for (const segment of [ topLayer, endpoint, name ]) {
        layer = layer[segment] || (layer[segment] = {});
      }
      Object.assign(layer, {
        path,
        fetch: 'get' === method ? undefined : { method }
      });
    }
  }

  const outputDefault = {
    ...defaultConfig,
    endpoints
  };
  objectInsert(outputDefault.endpoints, overrides);
  const promiseDefault = writeFileAsync(__dirname + '/../config/default.json', JSON.stringify(outputDefault, null, 2));

  const outputKernel = {
    ...outputDefault,
    key: undefined,
    keyPath: undefined,
    regionPath: "queryParams.platform"
  };
  const promiseKernel = writeFileAsync(__dirname + '/../config/kernel.json', JSON.stringify(outputKernel, null, 2));

  await Promise.all([ promiseDefault, promiseKernel ]);
}

/* Insert fields value into target recursively. Throws if a field in target would be overwritten. */
function objectInsert(target, value) {
  for (const key of Object.keys(value)) {
    if (target[key]) {
      if (typeof target[key] !== 'object') throw new Error(`Attempted to overwrite ${key}.`);
      objectInsert(target[key], value[key]);
    }
    else
      target[key] = value[key];
  }
}

main().catch(console.err);
