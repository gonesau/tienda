# Proyecto Tienda E-commerce

Este repositorio contiene el código fuente de una solución completa de comercio electrónico, dividida en tres componentes principales: un backend (API REST), un panel de administración y la tienda virtual (storefront) para el cliente.

---

## 🚀 Estructura del Proyecto

El proyecto está organizado en las siguientes carpetas principales:

* `/back`: Contiene el servidor backend desarrollado en Node.js con Express y Mongoose. Es el corazón de la aplicación, manejando la lógica de negocio, la base de datos y la comunicación en tiempo real.
* `/admin`: Una aplicación SPA (Single Page Application) desarrollada en Angular 12, destinada a los administradores para gestionar la tienda.
* `/tienda`: Una aplicación SPA desarrollada en Angular 12, que corresponde a la tienda virtual que ven los clientes.

---

## ✨ Características Principales

Basado en las dependencias y la configuración del servidor, el proyecto incluye las siguientes funcionalidades:

### Backend (`/back`)
* **API RESTful** construida con **Express**.
* **Base de Datos:** Conexión a **MongoDB** gestionada a través de **Mongoose**.
* **Autenticación y Seguridad:** Implementación de **JSON Web Tokens** (JWT) para proteger rutas y gestionar sesiones (`jsonwebtoken`, `jwt-simple`).
* **Hashing de Contraseñas:** Seguridad de contraseñas usando `bcrypt-nodejs`.
* **Comunicación en Tiempo Real:** Uso de **Socket.IO** para eventos en vivo (ej. actualizaciones del carrito de compras).
* **Gestión de Archivos:** Capacidad para manejar subida de archivos (imágenes de productos, etc.) mediante `connect-multiparty`.
* **Generación de Documentos:** Creación de archivos PDF sobre la marcha con `pdfkit` (probablemente para facturas o reportes).
* **Módulos de API:** Rutas definidas para gestionar:
    * Clientes (`cliente_route`)
    * Administradores (`admin_route`)
    * Productos (`producto_route`)
    * Cupones (`cupon_route`)
    * Configuración (`config_route`)
    * Carrito (`carrito_route`)
    * Ventas/Órdenes (`venta_route`)
    * Descuentos (`descuento_route`)
    * Reseñas (`review_route`)

### Panel de Administración (`/admin`)
* Frontend reactivo construido con **Angular 12**.
* **Gestión de Autenticación JWT** con `@auth0/angular-jwt`.
* **Componentes de UI** basados en `@ng-bootstrap/ng-bootstrap` e íconos de `bootstrap-icons`.
* **Editor de Texto Enriquecido:** Implementación de `ngx-tinymce` (probablemente para descripciones de productos o contenido de blog).
* **Exportación de Datos:** Capacidad para generar y descargar archivos de Excel (`exceljs`, `file-saver`).

### Tienda (Storefront) (`/tienda`)
* Frontend reactivo construido con **Angular 12**.
* **Gestión de Autenticación JWT** para clientes.
* **Cliente de Socket.IO:** Conexión con el backend para funcionalidades en tiempo real (`socket.io-client`).
* **Sistema de Calificación:** Componente de calificación por estrellas (`ng-starrating`) para las reseñas de productos.
* **Componentes de UI** basados en `@ng-bootstrap/ng-bootstrap`.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Versión/Dependencia |
| :--- | :--- | :--- |
| **Backend** | Node.js | - |
| | Express | `^5.1.0` |
| | Mongoose | `^8.16.4` |
| | Socket.IO | `^4.1.2` |
| | JSON Web Token | `^9.0.2` |
| | Nodemon | `^3.1.10` |
| **Frontend** | Angular | `~12.2.0` |
| (Admin y Tienda) | TypeScript | `~4.3.5` |
| | RxJS | `~6.6.0` |
| | ng-bootstrap | `^10.0.0` |

---

## ⚙️ Instalación y Puesta en Marcha

Para ejecutar este proyecto, necesitarás tener **Node.js** y **MongoDB** instalados localmente.

### 1. Backend (`/back`)

1.  Navega al directorio del backend:
    ```bash
    cd back
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  **Importante:** El backend está configurado para conectarse a una base de datos MongoDB en `mongodb://localhost:27017/tienda`. Asegúrate de que tu servicio de MongoDB esté activo.
4.  Inicia el servidor en modo de desarrollo (con reinicio automático):
    ```bash
    npm start
    ```
5.  El servidor backend se ejecutará en `http://localhost:4201`.

### 2. Panel de Administración (`/admin`)

1.  Abre una **nueva terminal** y navega al directorio del admin:
    ```bash
    cd admin
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo de Angular:
    ```bash
    npm start
    ```
4.  La aplicación de administración se ejecutará en `http://localhost:4200` (puerto por defecto de Angular).

### 3. Tienda (Storefront) (`/tienda`)

1.  Abre una **tercera terminal** y navega al directorio de la tienda:
    ```bash
    cd tienda
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo de Angular.
    * **Nota:** Dado que el panel de admin ya está usando el puerto 4200, debes iniciar la tienda en un puerto diferente.
    ```bash
    npm start -- --port 4202
    ```
4.  La aplicación de la tienda se ejecutará en `http://localhost:4202`.

---

## 📜 Scripts Principales

Puedes encontrar todos los scripts en los respectivos archivos `package.json` de cada carpeta.

### `back`
* `npm start`: Inicia el servidor backend con `nodemon app.js`.

### `admin`
* `npm start`: Inicia el servidor de desarrollo con `ng serve`.
* `npm run build`: Compila la aplicación para producción.
* `npm test`: Ejecuta las pruebas unitarias.

### `tienda`
* `npm start`: Inicia el servidor de desarrollo con `ng serve`.
* `npm run build`: Compila la aplicación para producción.
* `npm test`: Ejecuta las pruebas unitarias.
