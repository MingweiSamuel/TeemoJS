# TeemoJS

TeemoJS is a fast and lightweight Riot API wrapper written in Node.js.
Contained in less than 300 lines,
it has a minimalist design to make it flexible and easy to maintain.
There is a specific set of things TeemoJS aims to do, and it aims to do them well:

- Fast & Efficient Rate Limiting
- Automatic Retries

It is up to the developer to do the rest.

## Installation

```sh
npm install --save teemojs
```

## Usage

```node
const TeemoJS = require('teemojs');
let api = TeemoJS('RGAPI-KEY-HERE');

api.get('na1', 'summoner.getBySummonerName', 'lugnutsk')
  .then(data => console.log(data.name + "'s summoner id is " + data.id + '.'));
```

```node
// Get C9 Sneaky's games on Ezreal and Kalista for a particular season.
api.get('na1', 'match.getMatchlist', 78247, { champion: [81, 429], season: 8 })
  .then(...);
```

The `TeemoJS` constructor can take an second argument which is a configuration object.
By default, [defaultConfig.json](https://github.com/MingweiSamuel/TeemoJS/blob/master/defaultConfig.json)
is used. The supplied config object will override any corresponding values in the defaultConfig.
The configuration specifies the number of retries and maximum concurrent requests, as well as the Riot API
endpoint URLs.

To make calls to the api, the `TeemoJS.get` method is used. The first argument is a regional service name.
The second argument is a string corresponding to the `endpoints` field in defaultConfig (or config provided).
The third argument is an optional value used for endpoints that take in summoner id, summoner name, match id, etc.
The last argument is an optional object used as a dictionary for query parameters.
