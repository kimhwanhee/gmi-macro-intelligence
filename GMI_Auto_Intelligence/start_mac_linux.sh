#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
echo 'GMI running at http://localhost:8765'
python3 server.py 8765
