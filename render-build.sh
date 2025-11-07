#!/bin/bash

set -euo pipefail

npm install -g pnpm@10.17.0 --force
pnpm install --frozen-lockfile
pnpm --filter ./apps/web build

