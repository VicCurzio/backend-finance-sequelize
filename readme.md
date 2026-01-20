# 💰 Microservicio de Finanzas (Sequelize)

Este microservicio es responsable de la gestión de transacciones financieras (ventas y gastos) y la generación de métricas para el Dashboard. Utiliza Sequelize ORM para la persistencia en PostgreSQL y garantiza la integridad de los datos mediante validación de tokens JWT.

## 🛠️ Tecnologías utilizadas

* Node.js & Express: Framework base del servidor.
* PostgreSQL: Base de datos relacional.
* Sequelize ORM: Gestión de modelos y migraciones.
* JWT (JsonWebToken): Seguridad y autorización de endpoints.

## 🚀 Instalación y Configuración

### 1. Requisitos previos

* Clonar el repositorio.
* Instalar dependencias:
```bash
npm install
```

### 2. Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:
```
PORT=3002
DATABASE_URL=postgresql:postgres://postgres:admin123@localhost:5432/dashboard_finanzas
JWT_SECRET=secret_key
NODE_ENV=production
```

**Nota:** Para el despliegue en Render, asegúrate de que `NODE_ENV` sea `production` para habilitar la conexión SSL con Supabase.

### 3. Base de Datos y Migraciones

Para crear las tablas de Ventas, Gastos y Métricas, ejecuta:
```bash
npx sequelize-cli db:migrate
```

## 📡 Endpoints del API

### Ventas y Gastos

* POST `/ventas` / `/gastos`: Crear un nuevo registro.
* GET `/ventas` / `/gastos`: Listar registros. Soporta filtros de tiempo:
  * Parámetros: `?filtro=dia|semana|mes|año&fechaSeleccionada=YYYY-MM-DD`.
* PUT `/ventas/:id` / `/gastos/:id`: Actualizar un registro existente.
* DELETE `/ventas/:id` / `/gastos/:id`: Eliminación lógica (Soft Delete). El registro permanece en la DB con la columna `deleted_at` pero se oculta de los resultados.

### Dashboard e Importación

* GET `/dashboard/line-chart`: Retorna datos agregados para visualización en gráficos (Recharts).
* POST `/import-json`: Carga masiva de datos. Formato:
```json
{
  "tipo": "venta",
  "datos": [{ "fecha": "2026-01-20", "categoria": "Hardware", "monto": 500, "descripcion": "Mouse" }]
}
```

## 🧪 Pruebas con Postman

1. Localiza el archivo `Finanzas - Sequelize.postman_collection.json` en la carpeta `/postman` de este repositorio.
2. Impórtalo en Postman.
3. **Importante:** Este microservicio requiere autorización. Debes obtener un token desde el Microservicio de Auth y pegarlo en la pestaña Authorization (Bearer Token) de la colección o de la solicitud.

## ⚙️ Características Técnicas Destacadas

* **Soft Delete:** Implementado mediante `paranoid: true` en los modelos de Sequelize.
* **KPIs en tiempo real:** Los montos de las métricas se actualizan automáticamente al crear o importar registros.
* **Arquitectura de Microservicios:** Servicio totalmente independiente que se comunica mediante la base de datos compartida y validación JWT.