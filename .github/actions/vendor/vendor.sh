#!/usr/bin/env bash

set -eu -o pipefail

BASE=$(git branch --show-current)
WORK="work-$(git rev-parse HEAD)"

echo ::notice::fetch origin ${BRANCH}
git fetch origin "${BASE}"
git fetch origin "${BRANCH}" || true
echo ::notice::checkout ${BRANCH}
git checkout "${BRANCH}" || git checkout -b "${BRANCH}"
echo ::notice::release branch ${BRANCH} @ $(git rev-parse HEAD)
echo ::notice::merge ${BASE}
git merge "${BASE}" -X theirs
echo ::notice::apply patch

mkdir -p .cargo
cargo vendor >> .cargo/config

git checkout -b "${WORK}"
git add .cargo/config
git add vendor
git commit -m "${MESSAGE}"

git checkout "${BRANCH}"
git merge "${WORK}" -X ours
git push origin "${BRANCH}"
