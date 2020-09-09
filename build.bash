#!/bin/bash
set -xe

# Fix dependency import issue in node-fetch.
sed -i "s/'form-data'/'form-data\/index'/g" node_modules/\@types/node-fetch/index.d.ts

# Generate spec and model source.
curl -o srcgen/.spec.json http://www.mingweisamuel.com/riotapi-schema/openapi-3.0.0.json
node srcgen

# Rune ESLint.
node ./node_modules/eslint/bin/eslint.js src/** || echo "LINTING FAILED"

# Compile typescript.
node node_modules/typescript/bin/tsc

# Post-processing.
sed -i "s/^declare /export declare /g" dist/index.d.ts
sed -i "s/\.\.\.\[kwargs,\s*\.\.\._\]/kwargs/g" dist/index.js
sed -i "s/\.\.\.\kwargs/kwargs/g" dist/index.js

# Browserify.
node node_modules/browserify/bin/cmd.js dist/index.js -s TeemoJS --no-bf --no-bundle-external -o dist/browser.js
node node_modules/browserify/bin/cmd.js dist/index.js -s TeemoJS --no-bf --no-bundle-external -p tinyify -o dist/browser.min.js
