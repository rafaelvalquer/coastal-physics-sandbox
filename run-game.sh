#!/usr/bin/env sh
set -e
if [ ! -d node_modules ]; then
  echo "Instalando dependências..."
  npm install
fi
npm run dev
