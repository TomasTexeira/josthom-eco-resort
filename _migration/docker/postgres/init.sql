-- init.sql
-- Se ejecuta una sola vez cuando el contenedor de PostgreSQL arranca por primera vez.
-- Las tablas las crea Alembic al levantar FastAPI, este archivo solo
-- asegura que la extensión uuid-ossp esté disponible.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
