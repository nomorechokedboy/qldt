#!/bin/sh
# Save the e2e database (and the signed-in browser state) under a name, so
# `E2E_SNAPSHOT=<name> pnpm test <chapter>` can start from that point.
set -e
name="${1:?usage: snapshot.sh <name>}"
dir="$(dirname "$0")/../.tmp/snapshots/$name"
mkdir -p "$dir"
cp -f "$(dirname "$0")"/../.tmp/e2e.db* "$dir"/
echo "saved $dir"
