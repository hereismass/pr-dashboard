#!/bin/bash
echo -e "Building..."
npm run production

echo -e "Deploying to Github Pages..."

git config user.email $GH_EMAIL
git config user.name $GH_NAME
gh-pages -d dist

