// This file creates defaultConfig.json
// This is not meant to be `require`d in a project.
const Promise = require("bluebird");
const req = require("request-promise-native");
const fs = Promise.promisifyAll(require("fs"));
const { JSDOM } = require("jsdom");

let defaultConfig = require('./emptyConfig.json');

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
      let version = tokens.pop(); // V3 or V4
      for (let i = 0; i < tokens.length; i++) {
        camelName += i ? tokens[i].charAt(0).toUpperCase() + tokens[i].substr(1) : tokens[i];
      }
      console.log(camelName);

      let endpoint = {};
      res[camelName] = endpoint;

      let data = JSON.parse(body);
      let dom = new JSDOM(data.html);
      let ops = dom.window.document.getElementsByClassName('operation');
      for (let op of ops) {
        let opName = op.getAttribute('id').substr(1);
        let path = op.getElementsByClassName('path')[0].textContent;
        path = path.trim().replace(/\{\S+?\}/g, '%s');
        console.log('  ' + opName + ': ' + path);
        endpoint[opName] = path;
      }
    }
    defaultConfig.endpoints = res;
    return Promise.all([
      fs.writeFileAsync('defaultConfig.json', JSON.stringify(defaultConfig, null, 2)),
    ]);
  });
//  .then(res => fs.writeFileAsync('defaultConfig.json', JSON.stringify(res, null, 2)));
