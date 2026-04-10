# Guía de inicio local — Josthom Eco Resort
## De cero a correr en ~20 minutos

---

## ✅ Checklist de prerequisitos

Antes de empezar, verificá que tenés instalado:

| Herramienta | Comando para verificar | Instalar si no tenés |
|---|---|---|
| Python 3.11+ | `python3 --version` | https://python.org/downloads |
| Node.js 18+ | `node --version` | https://nodejs.org (LTS) |
| Docker Desktop | `docker --version` | https://docker.com/products/docker-desktop |
| Git | `git --version` | ya lo tenés si clonaste el repo |

> **¿En qué sistema operativo estás?**
> - Los comandos de abajo son para **Mac/Linux**.
> - En Windows, reemplazá `python3` por `python` y `source venv/bin/activate` por `venv\Scripts\activate`.

---

## PASO 1 — Levantar PostgreSQL + Redis con Docker

Abrí una terminal y ejecutá **un solo comando**. Esto levanta la base de datos y Redis en Docker (sin tocar nada de tu sistema):

```bash
docker run -d \
  --name josthom-postgres \
  -e POSTGRES_DB=josthom \
  -e POSTGRES_USER=josthom \
  -e POSTGRES_PASSWORD=josthom_dev_2024 \
  -p 5432:5432 \
  postgres:16-alpine
```

```bash
docker run -d \
  --name josthom-redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Verificar que están corriendo:**
```bash
docker ps
```

Deberías ver dos containers: `josthom-postgres` y `josthom-redis` con estado `Up`.

> ⚠️ **Si Docker Desktop no está abierto**, abrilo primero y esperá que el ícono de la ballena aparezca en la barra de estado.

---

## PASO 2 — Configurar el entorno Python (FastAPI)

Abrí **una terminal nueva** (o la misma, pero en la carpeta correcta):

```bash
# Ir a la carpeta de la API
cd _migration/api

# Crear entorno virtual Python
python3 -m venv venv

# Activar el entorno
source venv/bin/activate          # Mac/Linux
# venv\Scripts\activate           # Windows

# El prompt debería cambiar a algo como: (venv) $

# Instalar todas las dependencias
pip install -r requirements.txt
```

> ⏱️ La instalación tarda ~2-3 minutos la primera vez.

---

## PASO 3 — Crear el archivo .env de la API

El archivo `.env.local` ya está creado en `_migration/api/`. Solo necesitás copiarlo:

```bash
# (Dentro de _migration/api/)
cp .env.local .env
```

**¿Qué contiene?** Las variables de configuración para desarrollo local: URL de la base de datos, clave secreta para JWT, etc. Todo pre-configurado para que funcione sin cambiar nada.

---

## PASO 4 — Crear las tablas y el usuario admin (seed)

```bash
# (Dentro de _migration/api/, con el venv activo)
python scripts/seed.py
```

**Salida esperada:**
```
✅ Usuario admin creado: admin@josthom.com.ar / josthom2024!
   ⚠️  CAMBIÁ la contraseña después del primer login!
✅ Contenido creado: sección 'hero'
✅ Contenido creado: sección 'about'
✅ Contenido creado: sección 'experience'
✅ Contenido creado: sección 'location'
✅ Contenido creado: sección 'contact'
✅ Contenido creado: sección 'gallery'

🌱 Seed completado!
```

---

## PASO 5 — Arrancar la API

```bash
# (Dentro de _migration/api/, con el venv activo)
uvicorn app.main:app --reload --port 8000
```

**Salida esperada:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

### ✅ Verificar que funciona

Abrí en el browser: **http://localhost:8000/health**

Debería devolver:
```json
{"status": "ok", "version": "1.0.0"}
```

**Ver la documentación interactiva de la API:**
http://localhost:8000/docs

> Ahí podés probar TODOS los endpoints directamente desde el browser. Es como Postman pero automático.

---

## PASO 6 — Configurar Next.js

Abrí **otra terminal** (dejá la de uvicorn corriendo en la anterior):

```bash
# Ir a la carpeta del frontend
cd _migration/nextjs

# Instalar dependencias
npm install

# Crear el archivo de variables de entorno
cp .env.local.example .env.local
```

El `.env.local` ya tiene `NEXT_PUBLIC_API_URL=http://localhost:8000` — apunta directo a tu API local. No hace falta cambiar nada.

---

## PASO 7 — Arrancar el frontend

```bash
# (Dentro de _migration/nextjs/)
npm run dev
```

**Salida esperada:**
```
  ▲ Next.js 15.x.x
  - Local: http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.1s
```

### ✅ Abrir el sitio

Abrí en el browser: **http://localhost:3000**

Vas a ver el sitio completo cargando datos desde tu API local.

---

## PASO 8 — Probar el panel admin

1. Ir a: **http://localhost:3000/login**
2. Email: `admin@josthom.com.ar`
3. Contraseña: `josthom2024!`
4. Deberías entrar al panel en `/admin`

---

## 🗂️ Resumen de terminales abiertas

Para que todo funcione en simultáneo necesitás **2 terminales**:

| Terminal | Directorio | Comando |
|---|---|---|
| Terminal 1 | `_migration/api/` | `uvicorn app.main:app --reload` |
| Terminal 2 | `_migration/nextjs/` | `npm run dev` |

Docker corre en el background (no necesita terminal dedicada).

---

## 🐛 Problemas comunes

### "ModuleNotFoundError" al correr el seed o uvicorn
```bash
# Asegurate de tener el venv activo:
source venv/bin/activate   # (Mac/Linux)
# El prompt debe mostrar (venv) al inicio
```

### "Connection refused" al conectar a PostgreSQL
```bash
# Verificar que el container está corriendo:
docker ps

# Si no aparece josthom-postgres, levantarlo de vuelta:
docker start josthom-postgres
docker start josthom-redis
```

### Puerto 8000 o 3000 ya en uso
```bash
# Cambiar el puerto de uvicorn:
uvicorn app.main:app --reload --port 8001

# Y actualizar .env.local de Next.js:
# NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Error CORS al hacer requests desde Next.js
Asegurate de que `FRONTEND_URL=http://localhost:3000` esté en el `.env` de la API.

---

## 📦 Para detener todo

```bash
# Detener containers Docker:
docker stop josthom-postgres josthom-redis

# Para volver a arrancarlos la próxima vez:
docker start josthom-postgres josthom-redis
```

---

## ¿Qué sigue?

Una vez que todo corre localmente, el próximo paso es:

1. **Agregar una cabaña de prueba** desde el panel admin (`/admin/accommodations`)
2. **Probar el flujo completo**: ver la cabaña en el sitio → abrir el calendario → hacer una reserva de prueba → verla en el admin
3. Cuando todo funciona local → **deploy a Vercel** (Next.js) y **deploy a la NAS** (FastAPI + Docker)
