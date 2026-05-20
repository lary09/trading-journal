# Spec: Trading Journal Funcional 100%

## Objetivo

Llevar la app a un estado realmente funcional para uso real de un trader, eliminando fallos de seguridad, inconsistencias de esquema, pantallas mock y contratos rotos entre UI, API y base de datos.

## Estado actual

### Ya funciona

- Registro con email/password
- Login con credenciales
- Sesiones con Auth.js
- Middleware de protección de rutas
- Conexión a Neon
- Lectura básica de trades por usuario
- Dashboard y analytics base
- Journal diario

### No está al 100%

- Seguridad de edición/borrado de trades
- Cierre de sesión lateral
- Consistencia de migraciones / esquema / scripts
- Estrategias
- Detalle de trade con datos reales
- Watchlist por usuario
- Import/export completos
- Replay / ingestión de mercado / backtesting
- Eliminación de datos demo y mocks en flujos core

## Principios

1. Corregir primero seguridad y modelo de datos.
2. Tener una sola verdad para schema, DTOs y lógica de dominio.
3. Terminar primero los flujos core: auth, strategies, trades, dashboard, journal.
4. Quitar mocks de cualquier flujo autenticado principal.
5. Dejar replay, export y backtesting sobre datos reales, no placeholders.

## Fases

## Fase 1: Seguridad y ownership de datos

### Objetivo

Cerrar huecos críticos antes de tocar features nuevas.

### Tareas

- [ ] Corregir `PATCH` y `DELETE` de `app/api/trades/[id]/route.ts` para filtrar por `id` y `userId`.
- [ ] Revisar todas las rutas API y confirmar que cada lectura/escritura está scopeada al usuario correcto.
- [ ] Corregir el botón lateral de sign out en `components/layout/app-shell.tsx`.
- [ ] Mantener un único flujo correcto de cierre de sesión en toda la app.
- [ ] Revisar `trustHost` y configuración Auth.js para local vs producción.
- [ ] Revisar si `allowDangerousEmailAccountLinking` realmente se necesita; si no, retirarlo.
- [ ] Exigir auth en rutas de replay e ingestion también fuera de producción.
- [ ] Validar payloads consistentemente en rutas write.

### Criterio de aceptación

- Un usuario no puede modificar ni borrar trades ajenos.
- El logout funciona desde cualquier navegación.
- Ninguna ruta sensible se puede usar sin sesión.

## Fase 2: Canonical schema

### Objetivo

Eliminar la deriva entre `db/schema.ts`, migraciones y scripts SQL viejos.

### Tareas

- [ ] Elegir `db/schema.ts` como fuente canónica única.
- [ ] Auditar `drizzle/` y `scripts/` y retirar o marcar como obsoletos los scripts de era Supabase.
- [ ] Resolver el conflicto entre `users.id text` actual y scripts viejos con `auth.users` y `uuid`.
- [ ] Confirmar que `password_hash` exista oficialmente en migraciones canónicas.
- [ ] Alinear tipos inconsistentes como `confidenceLevel`.
- [ ] Añadir constraints e índices faltantes.
- [ ] Crear unicidad para barras diarias por símbolo y fecha.
- [ ] Documentar un flujo único de setup de base de datos para entorno nuevo.

### Criterio de aceptación

- Un entorno nuevo levanta con un solo camino de setup.
- Schema, migraciones y runtime coinciden.
- Las tablas activas soportan todos los flujos actuales sin SQL manual adicional.

## Fase 3: Contratos de dominio unificados

### Objetivo

Hacer que UI, API y server actions hablen el mismo idioma.

### Tareas

- [ ] Definir DTOs/validaciones canónicas para trades.
- [ ] Definir DTOs/validaciones canónicas para strategies.
- [ ] Mover lógica de negocio repetida a una capa compartida.
- [ ] Evitar duplicar reglas entre `app/api/*` y server actions.
- [ ] Decidir el modelo real de strategies.
- [ ] Alinear la UI de strategies con lo que realmente existe en DB.
- [ ] O bien agregar los campos que la UI promete, o simplificar la UI.

### Criterio de aceptación

- Crear strategy y listar strategies usan el mismo contrato.
- Crear trade por action y por API produce el mismo resultado.
- No hay pantallas esperando campos que el backend no devuelve.

## Fase 4: Flujos core completos

### Objetivo

Terminar el corazón del producto: strategies, trades, dashboard y journal.

### Tareas

- [ ] Completar CRUD usable de strategies.
- [ ] Completar lifecycle de trades: crear, listar, ver detalle, editar, borrar.
- [ ] Implementar la ruta edit real o eliminar el CTA roto.
- [ ] Reemplazar datos mock del detalle de trade por datos reales cuando existan.
- [ ] Eliminar demo trades del dashboard autenticado.
- [ ] Mejorar empty states reales para usuarios sin datos.
- [ ] Validar relación trade <-> strategy.

### Criterio de aceptación

- Un usuario puede operar toda la app core sin encontrarse mocks ni enlaces rotos.
- Dashboard y detalle muestran datos reales del usuario.

## Fase 5: Watchlist y mercado

### Objetivo

Separar correctamente catálogo de símbolos de watchlist por usuario.

### Tareas

- [ ] Crear modelo de watchlist por usuario.
- [ ] Mantener `symbols` como catálogo global, no watchlist.
- [ ] Corregir `app/api/watchlist/route.ts` para ownership real.
- [ ] Permitir agregar/quitar símbolos por usuario.
- [ ] Revisar `Tiingo` para que haga upsert real sin duplicados.
- [ ] Completar `Polygon` o retirarlo temporalmente de la UX.
- [ ] Sustituir tickers hardcodeados en procesos nocturnos.

### Criterio de aceptación

- Dos usuarios tienen watchlists distintas.
- La sincronización de precios no duplica barras.

## Fase 6: Importación real

### Objetivo

Convertir importación CSV en una feature usable.

### Tareas

- [ ] Diseñar flujo parse -> preview -> validación -> confirmación.
- [ ] Definir formato CSV soportado en V1.
- [ ] Normalizar columnas a trade canonical model.
- [ ] Reportar errores por fila.
- [ ] Evitar duplicados por reimport.
- [ ] Persistir historial de importaciones.

### Criterio de aceptación

- El usuario puede subir CSV, revisar errores y confirmar import.
- Reimportar el mismo archivo no genera duplicados silenciosos.

## Fase 7: Exportación real

### Objetivo

Permitir sacar datos del sistema de forma confiable.

### Tareas

- [ ] Implementar export de trades.
- [ ] Implementar export de strategies.
- [ ] Añadir filtros por fecha/estado/símbolo/strategy.
- [ ] Verificar que solo exporta datos del usuario autenticado.

### Criterio de aceptación

- Los botones de export generan archivos reales y correctos.

## Fase 8: Replay y trade detail con datos reales

### Objetivo

Eliminar mock charts en zonas críticas.

### Tareas

- [ ] Hacer que el detalle de trade use barras reales de `bars_1d`.
- [ ] Hacer que replay lea primero de DB local.
- [ ] Añadir estados claros si faltan barras históricas.

### Criterio de aceptación

- El gráfico del trade ya no fabrica candles.

## Fase 9: Backtesting V1 honesto

### Objetivo

Tener una versión mínima pero honesta, no una simulación mal etiquetada.

### Tareas

- [ ] Definir qué significa backtesting en V1.
- [ ] Renombrar o reimplementar la lógica actual si solo es benchmark simple.
- [ ] Guardar parámetros reproducibles.
- [ ] Mostrar métricas reales coherentes con la lógica implementada.

### Criterio de aceptación

- La UI describe exactamente lo que el motor hace.

## Fase 10: Harden final

### Objetivo

Cerrar calidad general del producto.

### Tareas

- [ ] Revisar analytics edge cases.
- [ ] Revisar mensajes engañosos de signup-success / verification.
- [ ] Alinear docs con el estado real.
- [ ] Añadir smoke tests mínimos para auth y core APIs.

### Criterio de aceptación

- No hay claims engañosos en UI o docs.
- Los flujos core tienen validación básica automatizada.

## Orden de ejecución recomendado

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5
6. Fase 6
7. Fase 7
8. Fase 8
9. Fase 9
10. Fase 10

## Milestone V1 usable

La app puede considerarse realmente usable cuando estén completas estas fases:

- Fase 1
- Fase 2
- Fase 3
- Fase 4
- Fase 5
- Fase 6

## Decisiones operativas

- No seguir agregando UI nueva hasta cerrar seguridad y contratos.
- No depender de scripts SQL viejos si ya no representan el modelo actual.
- No mostrar datos demo en flujos autenticados.
- No mantener CTAs que apunten a features inexistentes.

## Próxima ejecución inmediata

### Sprint 1

- [ ] Corregir ownership de trades
- [ ] Arreglar logout
- [ ] Auditar auth sensible
- [ ] Cerrar deriva de schema
- [ ] Alinear strategies UI/API

### Sprint 2

- [ ] Completar trade detail real
- [ ] Quitar demo dashboard
- [ ] Completar edit trade
- [ ] Watchlist por usuario
- [ ] Ingesta Tiingo robusta

### Sprint 3

- [ ] Import CSV usable
- [ ] Export real
- [ ] Replay real
- [ ] Backtesting V1 honesto
