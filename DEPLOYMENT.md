# 🚀 Guía de Despliegue - Sistema de Trading Journal

## Opciones de Despliegue

### 1. **Vercel (Recomendado)**

#### Pasos para desplegar en Vercel:

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Iniciar sesión en Vercel:**
   ```bash
   vercel login
   ```

3. **Desplegar el proyecto:**
   ```bash
   vercel
   ```

4. **Configurar variables de entorno en Vercel Dashboard:**
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `GITHUB_ID` y `GITHUB_SECRET` si usarás OAuth

#### Configuración automática con GitHub:
1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente que es un proyecto Next.js
3. Configura las variables de entorno en el dashboard
4. Cada push a `main` desplegará automáticamente

### 2. **Netlify**

#### Pasos para desplegar en Netlify:

1. **Crear archivo `netlify.toml`:**
   ```toml
   [build]
     command = "yarn build"
     publish = ".next"
   
   [build.environment]
     NODE_VERSION = "18"
   ```

2. **Subir a GitHub y conectar con Netlify**

3. **Configurar variables de entorno en Netlify Dashboard**

### 3. **Railway**

#### Pasos para desplegar en Railway:

1. **Instalar Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Iniciar sesión:**
   ```bash
   railway login
   ```

3. **Desplegar:**
   ```bash
   railway init
   railway up
   ```

## Configuración de Neon y Auth

### 1. **Crear base de datos en Neon:**
1. Ve a [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto
3. Guarda tu `DATABASE_URL`

### 2. **Ejecutar scripts de base de datos:**
Los scripts están en la carpeta `scripts/`:
- `001_create_profiles.sql`
- `002_create_strategies.sql`
- `003_create_trades.sql`
- `004_create_profile_trigger.sql`
- `005_create_performance_views.sql`

Ejecuta estos scripts en tu base de datos PostgreSQL.

### 3. **Configurar autenticación:**
1. Define `AUTH_SECRET`
2. Si usarás GitHub OAuth, configura `GITHUB_ID` y `GITHUB_SECRET`
3. Si usarás email/password, ejecuta también `scripts/init-auth.sql` o `scripts/006_add_user_password_hash.sql`

## Variables de Entorno Requeridas

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=your_auth_secret
```

## Comandos de Desarrollo

```bash
# Instalar dependencias
yarn install

# Ejecutar en desarrollo
yarn dev

# Construir para producción
yarn build

# Ejecutar en producción
yarn start
```

## Estructura del Proyecto

- `app/` - Páginas y rutas de Next.js 13+ (App Router)
- `components/` - Componentes reutilizables
- `scripts/` - Scripts SQL para la base de datos
- `public/` - Archivos estáticos

## Características del Sistema

- ✅ Autenticación con Auth.js
- ✅ Dashboard con analytics
- ✅ Gestión de trades
- ✅ Gráficos de rendimiento
- ✅ Exportación de datos
- ✅ Diseño responsive
- ✅ Tema oscuro/claro

## Solución de Problemas

### Error de build:
```bash
# Limpiar cache
rm -rf .next
yarn build
```

### Error de dependencias:
```bash
# Limpiar node_modules
rm -rf node_modules
yarn install
```

### Error de base de datos o auth:
1. Verifica las variables de entorno
2. Asegúrate de que tu base de Neon esté activa
3. Verifica que los scripts SQL se hayan ejecutado

## Soporte

Para problemas específicos:
1. Revisa los logs de Vercel/Netlify/Railway
2. Verifica la configuración de Neon/Auth.js
3. Revisa la consola del navegador para errores del cliente
