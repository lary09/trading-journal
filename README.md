# 📊 Trading Journal

Una aplicación web moderna para el seguimiento y análisis de operaciones de trading, construida con Next.js 15, Neon Postgres, Auth.js y Tailwind CSS.

## ✨ Características

- **📈 Dashboard Interactivo** - Métricas en tiempo real y resumen de operaciones
- **🎯 Gestión de Estrategias** - Crear, editar y seguir estrategias de trading
- **📊 Analytics Avanzados** - Gráficos y análisis de rendimiento
- **🔐 Autenticación Segura** - Sistema de login/signup con email/password y Auth.js
- **📱 Diseño Responsive** - Funciona perfectamente en móvil y desktop
- **⚡ Base de Datos** - PostgreSQL en Neon

## 🚀 Tecnologías

- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Backend:** Neon Postgres + Auth.js + Drizzle ORM
- **Gráficos:** Recharts
- **Deployment:** Vercel

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+ 
- Yarn o npm
- Base de datos PostgreSQL en Neon

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/trading-journal.git
cd trading-journal
```

2. **Instalar dependencias**
```bash
yarn install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
DATABASE_URL=postgresql://...
AUTH_SECRET=tu_auth_secret
NEXTAUTH_URL=http://localhost:3000
GITHUB_ID=opcional
GITHUB_SECRET=opcional
```

4. **Configurar base de datos**
Usa Drizzle como flujo canónico de schema:
```bash
pnpm db:migrate
```

Los scripts dentro de `scripts/` son heredados y no deben usarse como fuente principal del schema actual.

Si necesitas vistas de analytics adicionales o bootstrap manual, revísalos explícitamente antes de ejecutarlos.

5. **Ejecutar en desarrollo**
```bash
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📊 Estructura de la Base de Datos

### Tablas Principales

- **profiles** - Información de usuarios
- **trading_strategies** - Estrategias de trading
- **trades** - Operaciones individuales

### Vistas de Analytics

- **user_performance_summary** - Resumen de rendimiento
- **monthly_performance** - Rendimiento mensual

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Deploy automático en cada push

### Variables de Entorno Requeridas

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=tu_auth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 📱 Uso

1. **Registro/Login** - Crea una cuenta o inicia sesión
2. **Dashboard** - Ve tu resumen de trading
3. **Estrategias** - Gestiona tus estrategias de trading
4. **Analytics** - Analiza tu rendimiento con gráficos
5. **Nuevas Operaciones** - Registra tus trades

## 🔧 Desarrollo

### Scripts Disponibles

```bash
yarn dev          # Servidor de desarrollo
yarn build        # Build de producción
yarn start        # Servidor de producción
yarn lint         # Linting
```

### Estructura del Proyecto

```
├── app/                 # App Router (Next.js 15)
│   ├── auth/           # Páginas de autenticación
│   ├── dashboard/      # Dashboard principal
│   ├── analytics/      # Página de analytics
│   ├── strategies/     # Gestión de estrategias
│   └── trades/         # Gestión de trades
├── components/         # Componentes reutilizables
├── lib/               # Utilidades y configuraciones
├── scripts/           # Scripts SQL para PostgreSQL
└── public/            # Archivos estáticos
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la configuración de Neon, Auth.js y Drizzle
2. Abre un issue en GitHub
3. Contacta al equipo de desarrollo

## 🎯 Roadmap

- [ ] Notificaciones en tiempo real
- [ ] Integración con APIs de brokers
- [ ] Análisis técnico avanzado
- [ ] App móvil nativa
- [ ] Backtesting de estrategias
- [ ] Social trading features

---

**¡Happy Trading! 📈**

*Última actualización: $(date)*
