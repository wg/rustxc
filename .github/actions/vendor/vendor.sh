#!/usr/bin/env bash

set -eu -o pipefail

BASE=$(git branch --show-current)
WORK="work-$(git rev-parse HEAD)"

git fetch origin "${BRANCH}" || true
git checkout "${BRANCH}" || git checkout -b "${BRANCH}"
git merge "${BASE}" -X theirs

mkdir -p .cargo
cargo vendor >> .cargo/config

git checkout -b "${WORK}"
git add .cargo/config
git add vendor
git commit -m "${MESSAGE}"

git checkout "${BRANCH}"
git merge "${WORK}" -X ours
git push origin "${BRANCH}"
