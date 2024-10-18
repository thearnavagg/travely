#!/bin/bash


# Check and install frontend dependencies
if [ -f "client/package.json" ]; then
   echo "Installing frontend dependencies..."
   npm install --prefix client
   npm run build --prefix client
else
   echo "Frontend package.json not found"
fi


# Check and install backend dependencies
if [ -f "server/requirements.txt" ]; then
   echo "Setting up Python environment and installing backend dependencies..."
   python3 -m venv venv
   . venv/bin/activate
   pip install -r server/requirements.txt
else
   echo "Backend requirements.txt not found"
fi
