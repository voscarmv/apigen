# aimessagestore

Message storage and retrieval backend for [@voscarmv/aichatbot](https://www.npmjs.com/package/@voscarmv/aichatbot)

## Install

You may install `postgresql` and create a new username, password and database, with this script:

```bash
#!/bin/bash

## Install postgresql
if grep -e 'DATABASE_URL=' ./.env ; then
    exit
fi

sudo apt install -y postgresql postgresql-contrib

read -p "Postgres username: " PGUSER
read -s -p "Postgres password: " PASS
echo
read -p "Database name: " DB

sudo -u postgres psql <<EOF
CREATE DATABASE $DB;
CREATE USER $PGUSER WITH PASSWORD '$PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB TO $PGUSER;
\c $DB
GRANT ALL ON SCHEMA public TO $PGUSER;
EOF

echo "DATABASE_URL=postgres://$PGUSER:$PASS@localhost/$DB" >> .env
echo "✅ Database, user, and .env file created. Edit .env if needed."
```

Then just `npx drizzle-kit create` to create your `schema.ts` and you are ready to deploy with `npm publish`.