#!/bin/bash
set -xe

sed -i "s/'form-data'/'form-data\/index'/g" ./node_modules/\@types/node-fetch/index.d.ts
node ./node_modules/typescript/bin/tsc
node ./node_modules/browserify/bin/cmd.js dist/index.js -s TeemoJS --no-bf --no-bundle-external -o dist/browser.js
node ./node_modules/browserify/bin/cmd.js dist/index.js -s TeemoJS --no-bf --no-bundle-external -p tinyify -o dist/browser.min.js

