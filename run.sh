#!/bin/bash
set -e # fail on error
source ~/.cdbfly # for database credentials
source ~/.openai # for GPT credentials
export PGUSER=authenticator
export PGHOST=localhost
export PGPASSWORD=${CDBFLY_PASS}
export PGDATABASE=pagila
npm run dev
