#!/bin/bash
echo -e "Building..."
npm run production

echo -e "Deploying to Github Pages..."
gh-pages -d dist

