#!/bin/bash
set -e
corepack enable
corepack prepare pnpm@10.32.1 --activate
cd /home/expo/workingdir/build
pnpm install --frozen-lockfile