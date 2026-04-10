# Deploy en Synology NAS — Josthom Eco Resort

Guía paso a paso para levantar FastAPI + PostgreSQL + Redis + Celery en el NAS.

---

## Requisitos previos

- Synology NAS con **DSM 7.x**
- **Container Manager** instalado (Package Center → buscar "Container Manager")
- SSH habilitado: Panel de control → Terminal y SNMP → habilitar SSH
- Git instalado en el NAS (Package Center → Git)

---

## Paso 1 — Copiar el código al NAS

Desde tu Mac, conectate por SSH y cloná el repo:

```bash
ssh usuario@IP-DEL-NAS
cd /volume1/docker
git clone https://github.com/TomasTexeira/josthom-eco-resort.git josthom
```

O si preferís copiar solo la carpeta `_migration/`:

```bash
# Desde tu Mac:
scp -r ~/Desktop/josthom-eco-resort/_migration usuario@IP-DEL-NAS:/volume1/docker/josthom/
```

---

## Paso 2 — Crear el archivo .env

```bash
cd /volume1/docker/josthom/_migration/docker
cp .env.example .env
nano .env
```

Completá estos valores obligatorios:

| Variable | Dónde conseguirla |
|---|---|
| `POSTGRES_PASSWORD` | Inventala vos (ej: `mi_password_segura_2024`) |
| `SECRET_KEY` | Correr: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `MP_ACCESS_TOKEN` | Mercado Pago → Developers → Credenciales |
| `MP_PUBLIC_KEY` | Idem |
| `MP_WEBHOOK_SECRET` | Lo elegís vos, cualquier string largo |
| `SMTP_USER` | Tu email de Gmail |
| `SMTP_PASSWORD` | Gmail → Seguridad → Contraseñas de aplicación |
| `ADMIN_EMAIL` | Tu email de admin |
| `FRONTEND_URL` | La URL de Vercel (ej: `https://josthom-eco-resort.vercel.app`) |

---

## Paso 3 — Exponer el NAS a internet

### Opción A — Cloudflare Tunnel (recomendada, sin abrir puertos)

1. Crear cuenta gratis en [cloudflare.com](https://cloudflare.com)
2. Zero Trust → Networks → Tunnels → Create a tunnel
3. Instalar `cloudflared` en el NAS:
```bash
wget -O /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /usr/local/bin/cloudflared
cloudflared tunnel login
cloudflared tunnel create josthom-api
```
4. Apuntar el tunnel a `http://localhost:80`
5. Configurar el hostname → `api.josthom.com.ar` (o el subdominio que prefieras)
6. Obtenés HTTPS automático sin abrir ningún puerto en el router

### Opción B — DDNS + port forwarding (si no usás Cloudflare)

1. DSM → Panel de control → Acceso externo → DDNS → Agregar (`tunombre.synology.me`)
2. En el router: abrir puertos 80 y 443 y redirigirlos a la IP local del NAS
3. Certificado SSL: DSM → Panel de control → Seguridad → Certificado → Agregar → Let's Encrypt
4. Copiar los certs:
```bash
cp /usr/syno/etc/certificate/system/default/fullchain.pem /volume1/docker/josthom/_migration/docker/nginx/certs/
cp /usr/syno/etc/certificate/system/default/privkey.pem   /volume1/docker/josthom/_migration/docker/nginx/certs/
```

### Opción C — Sin SSL (solo para pruebas locales)

En `docker-compose.yml`, comentar el servicio `nginx` y agregar a `api`:
```yaml
ports:
  - "8000:8000"
```
En Vercel: `NEXT_PUBLIC_API_URL=http://IP-LOCAL-DEL-NAS:8000` (solo funciona en red local).

---

## Paso 4 — Levantar los contenedores

```bash
cd /volume1/docker/josthom/_migration/docker

# Construir las imágenes (solo la primera vez o después de cambios)
docker compose build

# Levantar todo en background
docker compose up -d

# Verificar que estén todos corriendo
docker compose ps

# Ver logs de la API en tiempo real
docker compose logs -f api
```

---

## Paso 5 — Crear las tablas en la base de datos

```bash
# Ejecutar Alembic dentro del contenedor api
docker compose exec api alembic upgrade head
```

Si es la primera vez y no hay migraciones generadas:
```bash
docker compose exec api alembic revision --autogenerate -m "initial"
docker compose exec api alembic upgrade head
```

---

## Paso 6 — Crear el usuario administrador

```bash
docker compose exec api python -c "
import asyncio, uuid
from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def run():
    async with AsyncSessionLocal() as db:
        admin = User(
            id=str(uuid.uuid4()),
            email='admin@josthom.com',
            name='Admin Josthom',
            hashed_password=get_password_hash('josthom2024'),
            role='admin',
            is_active=True
        )
        db.add(admin)
        await db.commit()
        print('✓ Admin creado:', admin.email)

asyncio.run(run())
"
```

> Cambiá la password `josthom2024` por una segura antes de correr esto.

---

## Paso 7 — Cargar las cabañas

Desde tu Mac con la API ya accesible:

```bash
cd ~/Desktop/josthom-eco-resort
API_URL=https://api.josthom.com.ar \
ADMIN_EMAIL=admin@josthom.com \
ADMIN_PASS=josthom2024 \
python _migration/scripts/seed_accommodations.py
```

---

## Paso 8 — Configurar el webhook de Mercado Pago

1. [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel)
2. Tu aplicación → Webhooks → Configurar
3. URL: `https://api.josthom.com.ar/api/payments/webhook/mercadopago`
4. Eventos: `payment`
5. Copiá el **Secret** generado → pegalo en `.env` como `MP_WEBHOOK_SECRET`
6. Reiniciá: `docker compose restart api`

---

## Paso 9 — Verificación final

```bash
# Health check
curl https://api.josthom.com.ar/health
# → {"status": "ok"}

# Probar login admin
curl -X POST https://api.josthom.com.ar/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@josthom.com","password":"josthom2024"}'
# → {"access_token": "..."}
```

---

## Arquitectura de conexiones

```
Usuario
  └→ Vercel (Next.js) — josthom-eco-resort.vercel.app
       └→ NAS / Synology (FastAPI + Nginx) — api.josthom.com.ar
            ├→ PostgreSQL  (solo interno, nunca expuesto)
            └→ Redis        (solo interno, nunca expuesto)

Mercado Pago → webhook → api.josthom.com.ar/api/payments/webhook/mercadopago
```

Los usuarios **nunca se conectan directamente al NAS**. Solo Vercel (server-side) y MP (webhooks) lo hacen.

---

## Comandos útiles

```bash
# Reiniciar solo la API
docker compose restart api

# Actualizar código y redeployar
git pull
docker compose build api
docker compose up -d api

# Ver logs de Celery (tareas programadas)
docker compose logs -f celery-beat

# Backup de la base de datos
docker compose exec postgres pg_dump -U josthom josthom \
  | gzip > /volume1/backups/josthom-$(date +%Y%m%d).sql.gz

# Restaurar backup
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U josthom josthom
```

---

## Backup automático (crontab en el NAS)

DSM → Panel de control → Programador de tareas → Crear → Tarea programada → Script:

```bash
# Backup diario a las 2am
docker exec josthom-postgres pg_dump -U josthom josthom \
  | gzip > /volume1/backups/josthom-$(date +%Y%m%d).sql.gz

# Borrar backups de más de 30 días
find /volume1/backups -name "josthom-*.sql.gz" -mtime +30 -delete
```
