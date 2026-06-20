# FleetFlow — Delivery Fleet Management System

A full-stack delivery management system built with Django 6, PostgreSQL, and React. Features a role-based REST API, an 8-state order lifecycle state machine, event-driven side effects, and three role-specific React dashboards.

---

## Tech Stack

**Backend:** Python, Django 6, Django REST Framework, PostgreSQL, JWT (SimpleJWT)  
**Frontend:** React, JavaScript, CSS (component-level, no UI libraries)

---

## Architecture

The project is structured into `backend/` and `frontend/` directories.

Backend follows a strict layered architecture:

```
Client -> URL Router -> Auth -> Permission -> View -> Service -> Database
```

Business logic lives exclusively in the service layer. Views handle input validation and response formatting only. Serializers describe data shape only.

**Django apps and their responsibilities:**

| App | Responsibility |
|-----|----------------|
| `users` | User profiles and role management (Customer, Driver, Admin) |
| `orders` | Order, Driver, and DriverAssignment models |
| `tracking` | Immutable TrackingEvent log per order |
| `notifications` | Auto-generated notifications per lifecycle event |
| `audit_logs` | Full audit trail of admin and driver actions |
| `deliveries` | Service layer and API orchestration |

---

## Features

**Authentication**
- JWT access and refresh tokens via SimpleJWT
- All endpoints require authentication by default
- Stateless — no server-side sessions

**Role-Based Access Control**
- Three roles: Customer, Driver, Admin
- Custom DRF permission classes: `IsCustomer`, `IsDriver`, `IsAdmin`
- Role assigned on registration, enforced at every endpoint

**Order Lifecycle State Machine**
- Eight enforced states: `created` → `assigned` → `accepted` → `picked_up` → `in_transit` → `out_for_delivery` → `delivered` / `cancelled`
- Invalid transitions rejected with a clear error
- State rules defined in a `VALID_TRANSITIONS` dictionary

**Concurrency Safety**
- `select_for_update()` locks rows during concurrent assignment requests
- `transaction.atomic()` wraps all multi-table writes
- Any failure rolls back the entire operation

**Event-Driven Side Effects**  
Every state change automatically triggers three things inside the service layer:
- A `TrackingEvent` record (immutable)
- A `Notification` to the relevant user
- An `AuditLog` entry

**Admin Dashboard API**
- List all orders with optional status filter
- Full order history per order (assignments + tracking events)
- List all drivers with availability filter
- Paginated audit log with action and entity filters

**React Frontend**
- JWT authentication via Axios interceptors
- Protected route components with role-based redirection
- Three role-specific dashboards: Customer, Driver, Admin
- Real-time data fetching with `useEffect`
- Component-level CSS, zero UI libraries

---

## API Endpoints

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

## Setup

**Backend**

```bash
cd backend
cp ../.env.example .env   # fill in your values
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```
