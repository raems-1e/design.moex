#!/bin/sh
set -eu
cd "$(dirname "$0")"
node --version
find app src tests -name '*.js' -exec node --check {} \;
find app tests -name '*.mjs' -exec node --check {} \;
node --test tests/*.test.mjs
