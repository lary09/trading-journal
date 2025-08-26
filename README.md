# 📊 Trading Journal

Una aplicación web moderna para el seguimiento y análisis de operaciones de trading, construida con Next.js 15, Supabase y Tailwind CSS.

## ✨ Características

- **📈 Dashboard Interactivo** - Métricas en tiempo real y resumen de operaciones
- **🎯 Gestión de Estrategias** - Crear, editar y seguir estrategias de trading
- **📊 Analytics Avanzados** - Gráficos y análisis de rendimiento
- **🔐 Autenticación Segura** - Sistema de login/signup con Supabase
- **📱 Diseño Responsive** - Funciona perfectamente en móvil y desktop
- **⚡ Base de Datos en Tiempo Real** - PostgreSQL con Supabase

## 🚀 Tecnologías

- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Gráficos:** Recharts
- **Deployment:** Vercel

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+ 
- Yarn o npm
- Cuenta de Supabase

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

Edita `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Configurar base de datos**
Ejecuta los scripts SQL en tu proyecto de Supabase:
- `scripts/001_create_profiles.sql`
- `scripts/002_create_strategies.sql`
- `scripts/003_create_trades.sql`
- `scripts/004_create_profile_trigger.sql`
- `scripts/005_create_performance_views.sql`

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
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
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
├── scripts/           # Scripts SQL para Supabase
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

1. Revisa la [documentación de Supabase](https://supabase.com/docs)
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
