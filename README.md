# Tienda E-commerce

Sistema de administración para tienda e-commerce construido con Angular y Node.js.

## Descripción

Aplicación full-stack para la gestión administrativa de una tienda en línea. Permite la administración de clientes, productos y pedidos a través de un panel de control web.

## Arquitectura

```
tienda/
├── admin/          # Frontend Angular
├── tienda/         # Frontend Tienda Cliente
├── back/           # Backend Node.js/Express
└── uploads/        # Archivos subidos (generado en runtime)
```

## Tecnologías

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


## Estructura del Proyecto

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


##Estado del Proyecto

| Funcionalidad | Estado | Progreso |
|---------------|--------|----------|
| Autenticación | ✅ Completo | 85% |
| CRUD Clientes | ✅ Completo | 90% |
| CRUD Productos | 🔄 En desarrollo | 30% |
| Dashboard | 🔄 Básico | 40% |
| Pedidos | ❌ Pendiente | 0% |
| Reportes | ❌ Pendiente | 0% |


##Autor

**gonesau**
- GitHub: [@gonesau](https://github.com/gonesau)

---

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/gonesau/tienda)

