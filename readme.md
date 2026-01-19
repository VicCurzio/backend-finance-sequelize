# Microservicio de Finanzas (Sequelize)

Este microservicio gestiona las ventas, gastos y métricas financieras del Dashboard.

## Requisitos de Instalación
1. Clonar el repositorio.
2. Ejecutar `npm install`.
3. Configurar el archivo `.env` con las credenciales de PostgreSQL y el `JWT_SECRET` compartido.

## Ejecución
- Modo desarrollo: `npm run dev`
- Migraciones: `npx sequelize-cli db:migrate`

## Importación Inicial (Carga JSON)
Para cumplir con el requisito 1.10, utiliza el endpoint:
`POST /import-json`
Envía un body con el tipo ('venta' o 'gasto') y un array de objetos bajo la llave 'datos'.

## Endpoints Principales
- **Ventas**: GET (con filtro día/semana/mes/año), POST, PUT, DELETE (Soft Delete).
- **Gastos**: GET, POST, PUT, DELETE (Soft Delete).
- **Dashboard**: GET `/dashboard/line-chart` para datos agregados.

# Microservicio de Finanzas (Sequelize)

Gestión de ventas, gastos y métricas financieras con persistencia en PostgreSQL y validación JWT.

## Instalación
1. `npm install`
2. Configurar `.env` (DB_USER, DB_PASS, DB_NAME, JWT_SECRET).
3. Ejecutar migraciones: `npx sequelize-cli db:migrate`.

## Ejecución
- Desarrollo: `npm run dev`.
- Producción: `npm start`.

## Características Implementadas
- **CRUD Completo**: Ventas y Gastos con filtros de tiempo.
- **Soft Delete**: Los registros usan la columna `deleted_at`.
- **KPIs**: Tabla de métricas calculadas en tiempo real.
- **Importación Masiva**: Endpoint `/import-json` para carga de datos.
- **Seguridad**: Middleware de validación de tokens JWT.

## Pruebas con Postman
En la carpeta `/postman` de este repositorio encontrarás el archivo `Finanzas - Sequelize.postman_collection.json`. 
1. Impórtalo en tu Postman.
2. Asegúrate de tener el Microservicio de Auth corriendo para obtener el Token.
3. Copia el Token en la pestaña **Authorization** (Bearer Token) de las peticiones de Ventas/Gastos.