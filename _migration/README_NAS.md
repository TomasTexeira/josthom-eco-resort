# Setup Synology NAS — Josthom Eco Resort

## Paso 1: Instalar Docker en la Synology

1. Abrí el **Package Center** en DSM
2. Buscá **Container Manager** e instalalo
3. (Alternativa) Instalá Docker via SSH: no necesario, Container Manager es suficiente

---

## Paso 2: Crear carpeta del proyecto

Via SSH o File Station:
```
/volume1/docker/josthom/
  ├── api/          ← código FastAPI
  ├── docker/       ← docker-compose.yml, nginx/
  └── scripts/      ← script de migración
```

---

## Paso 3: Configurar DDNS (IP dinámica del ISP)

1. En DSM → Control Panel → External Access → DDNS
2. Activar Synology DDNS (gratis): `tu-nombre.synology.me`
3. **Alternativa recomendada (Cloudflare Tunnel):**
   - Sin necesidad de abrir puertos en el router
   - Gratis
   - Ver: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

---

## Paso 4: Certificado SSL (solo si usás port forwarding, no Cloudflare Tunnel)

```bash
# Desde Container Manager → Terminal del container nginx, o SSH a la NAS:
docker exec josthom-nginx sh -c "
  apk add certbot certbot-nginx && \
  certbot --nginx -d api.tu-dominio.com.ar
"
```

O usá el **Let's Encrypt integrado** de Synology DSM:
- Control Panel → Security → Certificate → Add → Get a certificate from Let's Encrypt

---

## Paso 5: Deploy

```bash
# En la NAS via SSH:
cd /volume1/docker/josthom/docker

# Copiar y completar variables de entorno:
cp .env.example .env
nano .env   # Completar con tus credenciales reales

# Levantar todos los servicios:
docker compose up -d

# Verificar que estén corriendo:
docker compose ps

# Ver logs:
docker compose logs -f api
```

---

## Paso 6: Migración de datos desde Base44

```bash
# En la NAS:
cd /volume1/docker/josthom/scripts

# Instalar dependencias:
pip3 install httpx asyncpg sqlalchemy[asyncio] python-dotenv

# Exportar de Base44 (necesita el .env del proyecto original):
python3 migrate_from_base44.py --export-only

# Importar a PostgreSQL:
python3 migrate_from_base44.py --import-only

# O ambas fases juntas:
python3 migrate_from_base44.py
```

---

## Verificación final

```bash
# Health check de la API:
curl https://api.tu-dominio.com.ar/health

# Respuesta esperada:
# {"status":"ok","version":"1.0.0"}

# Documentación interactiva (solo si DEBUG=true):
# https://api.tu-dominio.com.ar/docs
```

---

## Seguridad — ¿Los usuarios se conectan a la NAS?

**No.** Los usuarios del sitio web **nunca se conectan directamente a la NAS**.

El flujo de conexiones es:
```
Usuario → Vercel (Next.js en la nube) → API en NAS (solo el servidor de Vercel)
```

- El usuario ve el sitio en Vercel
- Vercel hace requests a tu API en la NAS en nombre del usuario
- La NAS **solo recibe conexiones del servidor de Vercel y de Mercado Pago (webhooks)**
- Los datos (PostgreSQL) nunca son accesibles desde internet, solo desde dentro del container

### Puertos abiertos en el router:
- Solo **443 (HTTPS)** → Nginx → FastAPI
- **80** → redirige a 443
- **PostgreSQL (5432), Redis (6379): nunca abiertos al exterior**

---

## Backup automático

Agregar al `crontab` de la NAS:
```bash
# Backup diario a las 2am
0 2 * * * docker exec josthom-postgres pg_dump -U josthom josthom | gzip > /volume1/backups/josthom-$(date +%Y%m%d).sql.gz

# Limpiar backups de más de 30 días
0 3 * * * find /volume1/backups -name "josthom-*.sql.gz" -mtime +30 -delete
```
