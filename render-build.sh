#!/bin/bash

set -euo pipefail

npm install -g pnpm@10.17.0 --force
pnpm install --frozen-lockfile
pnpm --filter ./apps/web build

# Ensure standalone bundle contains static assets and public files
mkdir -p apps/web/.next/standalone/.next/static
cp -R apps/web/.next/static/. apps/web/.next/standalone/.next/static/

mkdir -p apps/web/.next/standalone/public
cp -R apps/web/public/. apps/web/.next/standalone/public/

