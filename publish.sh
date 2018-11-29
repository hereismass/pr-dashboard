#!/bin/bash
echo -e "Building..."
npm run production

echo -e "Deploying to Github Pages..."

git config user.email "mass.zambelli@gmail.com"
git config user.name "Massimo Zambelli"
gh-pages -d dist

