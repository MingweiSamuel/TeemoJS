// This file creates defaultConfig.json.
const Promise = require("bluebird");
const req = require("request-promise-native");
const fs = Promise.promisifyAll(require("fs"))
const { JSDOM } = require("jsdom");

req('https://developer.riotgames.com/api-methods/')
  .then(body => {
    let dom = new JSDOM(body);

    let els = dom.window.document.getElementsByClassName('api_option');
    let endpoints = {};
    for (let el of els) {
      let name = el.getAttribute('api-name');
      if (name.startsWith('tournament'))
        continue;
      let url = 'https://developer.riotgames.com/api-details/' + name;
      endpoints[name] = req(url)
        .catch(e => req(url)); // 1 retry.
    }
    return Promise.props(endpoints);
  })
  .then(endpoints => {
    let res = {};
    for (let [name, body] of Object.entries(endpoints)) {
      let camelName = '';
      let tokens = name.split('-');
      for (let i = 0; i < tokens.length - 1; i++) {
        camelName += i ? tokens[i].charAt(0).toUpperCase() + tokens[i].substr(1) : tokens[i];
      }
      console.log(camelName);
      let endpoint = res[camelName] = {};
      let data = JSON.parse(body);
      let dom = new JSDOM(data.html);
      let ops = dom.window.document.getElementsByClassName('operation');
      for (let op of ops) {
        let opName = op.getAttribute('id').substr(1);
        let path = op.getElementsByClassName('path')[0].textContent;
        path = path.trim().replace(/\{\S+\}/g, '%s');
        console.log('  ' + opName + ': ' + path);
        endpoint[opName] = path;
      }
    }
    return {
      prefix: 'https://%s.api.riotgames.com',
      retries: 3,
      maxConcurrent: 2000,
      distFactor: 1.0,
      endpoints: res
    };
  })
  .then(res => fs.writeFileAsync('defaultConfig.json', JSON.stringify(res, null, 2)));
