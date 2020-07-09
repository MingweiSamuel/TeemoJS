#!/bin/bash
set -xe

bash build.bash

# TS_NODE_COMPILER_OPTIONS='{"include":["src/internal.semaphore.ts"]}'
TS_NODE_SKIP_PROJECT=true node node_modules/mocha/bin/mocha
