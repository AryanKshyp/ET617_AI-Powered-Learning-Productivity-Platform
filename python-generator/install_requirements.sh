#!/bin/bash
# Script to install requirements while skipping Windows-only packages
set -e

echo "Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel

echo "Installing requirements (skipping Windows-only packages)..."
# Filter out Windows-only packages and install
pip install --no-cache-dir $(grep -v "^pywin32" requirements.txt | grep -v "^pyreadline3" | tr '\n' ' ')

echo "Requirements installation completed successfully!"

