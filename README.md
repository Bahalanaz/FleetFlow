# Smart Logistics & Delivery Backend API System (JWT, Role-Based Access, PostgreSQL & Service Layer)

This repository documents my progress in building a real-world backend logistics system using Django REST Framework (DRF), JWT authentication, and PostgreSQL.

This project represents a major step into junior backend developer level, focusing on secure API design, role-based access control, delivery lifecycle management, and production-style architecture similar to systems used by Uber Eats and Amazon Logistics.

---

## 🚀 Project Overview

The system allows me to:

- Build RESTful APIs using Django REST Framework
- Implement JWT-based authentication system
- Connect Django with PostgreSQL database
- Create a multi-role user system (Customer, Driver, Admin)
- Design a full delivery lifecycle (created → assigned → accepted → picked_up → in_transit → delivered)
- Track every state change with a TrackingEvent system
- Trigger automated notifications on lifecycle events
- Log every admin and driver action in an AuditLog
- Enforce role-based access control using custom DRF permission classes
- Separate business logic into a clean service layer
- Use atomic database transactions to guarantee data consistency
- Build an admin dashboard API for order and driver management

This project simulates a simplified logistics backend system used in real delivery and e-commerce platforms.

---

## 🧠 Concepts Learned

### 1. Django REST Framework (DRF)

DRF is used to build scalable REST APIs in Django.


### 2. API Architecture Flow

Backend requests follow a structured flow:

```
Client → URL Routing → Authentication → Permission Check → View → Service Layer → Database → Response
```


### 3. Multi-App Django Architecture

The project is divided into focused Django apps:

| App | Responsibility |
|-----|---------------|
| `users` | UserProfile with roles (customer, driver, admin) |
| `orders` | Order, Driver, DriverAssignment models |
| `tracking` | TrackingEvent — immutable event log |
| `notifications` | System-generated notifications per user |
| `audit_logs` | Admin and driver action audit trail |
| `deliveries` | Service layer + API orchestration |


### 4. Role-Based Access Control (RBAC)

Implemented three custom DRF permission classes:

- `IsCustomer` — checks `UserProfile.role == 'customer'`
- `IsDriver` — checks `UserProfile.role == 'driver'`
- `IsAdmin` — checks `UserProfile.role == 'admin'`

Access rules enforced at every endpoint:

- Customers can create orders and view only their own orders
- Drivers can update delivery status only for orders assigned to them
- Admins can assign drivers and access the full dashboard


### 5. Service Layer Architecture

All business logic lives in `services/` modules, never in views or serializers.

```
View       → validates input, calls service, returns response
Service    → owns all business logic, writes to database
Serializer → only describes data shape, no logic
```


### 6. Delivery Lifecycle State Machine

The delivery progresses through enforced states only:

```
created → assigned → accepted → picked_up → in_transit → delivered
```

Invalid transitions are rejected with a clear error message. A dictionary-based state machine (`VALID_TRANSITIONS`) makes the rules explicit and easy to read.


### 7. Atomic Database Transactions

Every workflow that touches multiple tables is wrapped in `transaction.atomic()`.

For example, when a driver updates delivery status:
1. Order status is updated
2. TrackingEvent is created
3. Notification is created
4. AuditLog is created

If any step fails, all steps are rolled back. The database never ends up in a half-updated state.

`select_for_update()` is used to lock rows during concurrent requests, preventing two drivers from updating the same order simultaneously.


### 8. Event-Driven Side Effects

Every meaningful action in the system automatically triggers three things:

- A `TrackingEvent` record (immutable log of what happened)
- A `Notification` to the relevant user
- An `AuditLog` entry linking the action to the user who performed it

This happens inside the service layer, not the view. The view has no knowledge of these side effects.


### 9. JWT Authentication System

Implemented secure authentication using JWT:

- Access token for API requests
- Refresh token for session renewal
- Stateless authentication (no server sessions)
- User identity attached via `request.user`
- `DEFAULT_AUTHENTICATION_CLASSES` set globally in settings

### 10. Django ORM + PostgreSQL

Used Django ORM to interact with PostgreSQL database.

- ORM converts Python code into SQL queries
- PostgreSQL stores persistent relational data
- Models define database structure and relationships
- `select_related` and `prefetch_related` patterns used to avoid N+1 query issues


### 11. REST API Design Principles

- Resource-based endpoints (`/orders/`, `/deliveries/`, `/notifications/`)
- Clean JSON responses with consistent structure
- Proper HTTP status codes (`201 Created`, `400 Bad Request`, `403 Forbidden`, `404 Not Found`)
- User-based data isolation at the query level
- `DEFAULT_PERMISSION_CLASSES` set to `IsAuthenticated` globally — no endpoint is accidentally public


---

## 🛠️ Features

### 🔐 Authentication System
- JWT login system implemented
- Access and refresh token support
- Secure token-based API access
- User identity attached per request
- Global default: all endpoints require authentication

### 👤 Role System
- Three roles: `customer`, `driver`, `admin`
- Custom DRF permission classes per role
- Role assigned automatically on registration (default: customer)
- Role enforced at every endpoint — not just checked inside view logic

### 📦 Order System
- Customer creates orders with pickup and delivery location
- Order linked to the creating customer
- Customer can only view their own orders
- Full tracking timeline available per order

### 🚚 Delivery Lifecycle
- Admin assigns an available driver to a created order
- Driver advances status through enforced transitions
- Driver can only update orders they are assigned to
- On delivery completion, driver status resets to available automatically

### 📍 Tracking System
- Every state change creates an immutable `TrackingEvent`
- Events include timestamp and metadata (previous state, driver info)
- Customer can view the full tracking timeline for their order

### 🔔 Notification System
- Notifications generated automatically by service layer
- Linked to both the user and the relevant order
- API to list notifications and mark them as read

### 📋 Audit Log System
- Every admin and driver action is logged
- Records: who performed the action, what entity was affected, before/after state
- Admin can filter logs by action type or entity type

### 📊 Admin Dashboard APIs
- List all orders with optional status filter
- Full delivery history per order (assignments + tracking events)
- List all drivers with optional availability filter
- Paginated audit log viewer with filters

### 🐘 PostgreSQL Integration
- Django connected to PostgreSQL
- Migrations applied cleanly across all apps
- Real relational database with foreign key relationships

---

## 📡 API Endpoint Reference

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/token/` | Any | Obtain JWT token |
| `POST` | `/api/token/refresh/` | Any | Refresh JWT token |
| `POST` | `/orders/create/` | Customer | Create a new order |
| `GET` | `/orders/` | Customer | List own orders |
| `GET` | `/orders/<id>/tracking/` | Customer | View tracking timeline |
| `POST` | `/deliveries/assign/` | Admin | Assign driver to order |
| `POST` | `/deliveries/update-status/` | Driver | Advance delivery state |
| `GET` | `/deliveries/my-deliveries/` | Driver | View own assignments |
| `GET` | `/deliveries/admin/orders/` | Admin | All orders (filter `?status=`) |
| `GET` | `/deliveries/admin/orders/<id>/history/` | Admin | Full order history |
| `GET` | `/deliveries/admin/drivers/` | Admin | All drivers (filter `?status=`) |
| `GET` | `/deliveries/admin/audit-logs/` | Admin | Audit log (filter `?action=`, `?entity_type=`) |
| `GET` | `/notifications/` | Any | Own notifications |
| `PATCH` | `/notifications/<id>/read/` | Any | Mark notification as read |

---

## 🧪 Key Takeaways

- DRF is the standard for building backend APIs in Django
- JWT is essential for modern stateless authentication systems
- Role-based access control must use your own role system, not Django's built-in flags
- Business logic belongs in the service layer — never in views or serializers
- State machines are the correct pattern for lifecycle management
- Atomic transactions protect data integrity in any multi-step workflow
- Side effects (notifications, logs, events) belong in services, not views
- Every app should own one domain — cross-app imports should only go one way
- PostgreSQL is used for production-grade relational data storage
- `select_for_update()` is essential for preventing race conditions in concurrent systems

---

## 🚀 Outcome

By completing this project, I now understand:

- How to build secure, multi-role REST APIs using Django REST Framework
- How JWT authentication works in real systems
- How to design and enforce a delivery lifecycle state machine
- How the service layer pattern separates concerns in production backends
- How atomic transactions guarantee consistency across multiple database writes
- How to build an event log, notification system, and audit trail
- How Django apps are structured for real-world multi-domain projects
- How role-based access control is implemented correctly in DRF
- How `select_for_update()` handles concurrency in high-traffic systems

---

## 🎯 Current Level

I am progressing toward junior backend developer level, with practical understanding of:

- REST API development with Django REST Framework
- Authentication systems (JWT)
- Role-based authorization with custom permission classes
- PostgreSQL database integration and migrations
- Service layer architecture and separation of concerns
- Delivery lifecycle design with state machine patterns
- Atomic transaction-based backend logic
- Event-driven side effects (notifications, tracking, audit logs)
- Concurrent request safety with database-level row locking
- Real-world multi-app Django project structure
