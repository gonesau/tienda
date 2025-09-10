# 🛒 Tienda E-commerce

Sistema de administración para tienda e-commerce construido con Angular y Node.js.

## 📋 Descripción

Aplicación full-stack para la gestión administrativa de una tienda en línea. Permite la administración de clientes, productos y pedidos a través de un panel de control web.

## 🏗️ Arquitectura

```
tienda/
├── admin/          # Frontend Angular
├── tienda/         # Frontend Tienda Cliente
├── back/           # Backend Node.js/Express
└── uploads/        # Archivos subidos (generado en runtime)
```

## 🚀 Tecnologías

### Frontend (Inicialmente)
- **Angular** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Bootstrap** - Framework CSS
- **TinyMCE** - Editor de texto enriquecido
- **ng-bootstrap** - Componentes UI

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas
- **Multer/Multiparty** - Manejo de archivos

## 📦 Instalación

### Prerrequisitos

- Node.js (v16)
- MongoDB (v4.4)
- Angular CLI (v12.2.8) (`npm install -g @angular/cli`)

### 1. Clonar el repositorio

```bash
git clone https://github.com/gonesau/tienda.git
cd tienda
```

### 2. Configurar el Backend

```bash
cd back
npm install

# Iniciar MongoDB (comando depende de tu OS)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Iniciar servidor backend
npm start
```

El servidor backend estará disponible en `http://localhost:4201`

### 3. Configurar el Frontend

```bash
cd admin
npm install

# Iniciar servidor de desarrollo
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

## 🔧 Configuración

### Variables de Entorno (Backend)

Crear archivo `.env` en la carpeta `back/`:

```env
PORT=4201
MONGODB_URI=mongodb://localhost:27017/tienda
JWT_SECRET=gonesau
NODE_ENV=development
```

### Configuración de MongoDB

Por defecto, la aplicación se conecta a:
```
mongodb://localhost:27017/tienda
```

## 📚 API Endpoints

### Autenticación
- `POST /api/login_admin` - Login de administrador
- `POST /api/registro_admin` - Registro de administrador

### Clientes
- `GET /api/listar_clientes_filtro_admin` - Listar clientes
- `POST /api/registro_cliente_admin` - Crear cliente
- `GET /api/obtener_cliente_admin/:id` - Obtener cliente
- `PUT /api/actualizar_cliente_admin/:id` - Actualizar cliente
- `DELETE /api/eliminar_cliente_admin/:id` - Eliminar cliente

### Productos
- `POST /api/registro_producto_admin` - Crear producto

## 🔐 Autenticación

La aplicación utiliza JWT (JSON Web Tokens) para la autenticación. Los tokens se almacenan en `localStorage` del navegador.

### Headers requeridos para rutas protegidas:
```
Authorization: Bearer <token>
```

## 📁 Estructura del Proyecto

### Frontend (`/admin`)
```
src/
├── app/
│   ├── components/          # Componentes Angular
│   │   ├── clientes/       # CRUD de clientes
│   │   ├── productos/      # Gestión de productos
│   │   ├── login/          # Autenticación
│   │   ├── inicio/         # Dashboard
│   │   └── sidebar/        # Navegación
│   ├── services/           # Servicios Angular
│   ├── guards/             # Guards de rutas
│   └── models/             # Interfaces/Modelos
└── assets/                 # Recursos estáticos
```

### Backend (`/back`)
```
├── controllers/            # Controladores
├── models/                # Modelos de MongoDB
├── routes/                # Definición de rutas
├── middlewares/           # Middlewares personalizados
├── helpers/               # Utilidades
└── uploads/               # Archivos subidos
```

## 👤 Uso

### 1. Crear Administrador
```bash
# Desde el backend, hacer POST a /api/registro_admin
curl -X POST http://localhost:4201/api/registro_admin \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Admin",
    "apellidos": "Principal",
    "email": "admin@tienda.com",
    "password": "admin123",
    "telefono": "12345678",
    "rol": "admin",
    "dui": "12345678-9"
  }'
```

### 2. Iniciar Sesión
1. Navegar a `http://localhost:4200/login`
2. Ingresar credenciales del administrador
3. Acceder al panel de administración

### 3. Funcionalidades Disponibles
- ✅ **Gestión de Clientes**: CRUD completo
- 🔄 **Gestión de Productos**: En desarrollo
- 📊 **Dashboard**: Básico implementado

## 🧪 Testing

```bash
# Frontend
cd admin
ng test

# Backend
cd back
npm test
```

> **Nota**: Los tests están pendientes de implementación.

## 📝 Scripts Disponibles

### Backend
```bash
npm start          # Iniciar servidor con nodemon
npm run dev        # Alias para npm start
npm test          # Ejecutar tests (pendiente)
```

### Frontend
```bash
ng serve          # Servidor de desarrollo
ng build          # Build para producción
ng test           # Ejecutar tests unitarios
ng e2e            # Tests end-to-end
```

## 🐛 Problemas Conocidos

- [ ] Contraseñas por defecto para clientes (se está corrigiendo)
- [ ] Falta validación de archivos en backend
- [ ] CRUD de productos incompleto
- [ ] Falta manejo de errores robusto

## 🔄 Estado del Proyecto

| Funcionalidad | Estado | Progreso |
|---------------|--------|----------|
| Autenticación | ✅ Completo | 85% |
| CRUD Clientes | ✅ Completo | 90% |
| CRUD Productos | 🔄 En desarrollo | 30% |
| Dashboard | 🔄 Básico | 40% |
| Pedidos | ❌ Pendiente | 0% |
| Reportes | ❌ Pendiente | 0% |

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**gonesau**
- GitHub: [@gonesau](https://github.com/gonesau)

---

## 🚀 Próximas Versiones

### v0.1.0 (En desarrollo)
- [ ] CRUD completo de productos
- [ ] Sistema de categorías
- [ ] Mejoras en seguridad
- [ ] Validaciones de backend

### v0.3.0 (Planificado)
- [ ] Sistema de pedidos
- [ ] Dashboard con métricas
- [ ] Gestión de inventario
- [ ] Reportes básicos

---

