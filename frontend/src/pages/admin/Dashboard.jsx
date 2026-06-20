import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import './AdminDashboard.css'

function statusBadgeClass(status) {
    if (!status) return 'badge badge-pending'
    const s = status.toLowerCase()
    if (s === 'created' || s === 'pending') return 'badge badge-created'
    if (s === 'delivered' || s === 'done' || s === 'available') return 'badge badge-delivered'
    return 'badge badge-active'
}

function Dashboard() {
    const [user, setUser] = useState(null)
    const [orders, setOrders] = useState([])
    const [drivers, setDrivers] = useState([])
    const [auditLogs, setAuditLogs] = useState([])
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('orders')
    const [assignForm, setAssignForm] = useState({ order_id: '', driver_id: '' })
    const [assignMessage, setAssignMessage] = useState('')
    const [orderHistory, setOrderHistory] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('access')
        if (!token) { navigate('/login'); return }

        api.get('/users/me/')
            .then(res => setUser(res.data))
            .catch(() => navigate('/login'))

        fetchOrders()
        fetchDrivers()
        fetchAuditLogs()
    }, [navigate])

    function fetchOrders() {
        api.get('/deliveries/admin/orders/')
            .then(res => setOrders(res.data))
            .catch(() => setError('Failed to load orders.'))
    }

    function fetchDrivers() {
        api.get('/deliveries/admin/drivers/')
            .then(res => setDrivers(res.data))
            .catch(() => setError('Failed to load drivers.'))
    }

    function fetchAuditLogs() {
        api.get('/deliveries/admin/audit-logs/')
            .then(res => setAuditLogs(res.data))
            .catch(() => setError('Failed to load audit logs.'))
    }

    async function handleAssignDriver(e) {
        e.preventDefault()
        setAssignMessage('')
        try {
            await api.post('/deliveries/assign/', {
                order_id: parseInt(assignForm.order_id),
                driver_id: parseInt(assignForm.driver_id)
            })
            setAssignMessage('Driver assigned successfully.')
            setAssignForm({ order_id: '', driver_id: '' })
            fetchOrders()
            fetchDrivers()
        } catch (err) {
            setAssignMessage(err.response?.data?.error || 'Failed to assign driver.')
        }
    }

    async function handleViewHistory(orderId) {
        try {
            const res = await api.get(`/deliveries/admin/orders/${orderId}/history/`)
            setOrderHistory(res.data)
        } catch {
            setError('Failed to load order history.')
        }
    }

    function handleLogout() {
        const refresh = localStorage.getItem('refresh')
        api.post('/token/blacklist/', { refresh }).finally(() => {
            localStorage.removeItem('access')
            localStorage.removeItem('refresh')
            navigate('/login')
        })
    }

    const tabs = [
        { key: 'orders', label: 'Orders' },
        { key: 'drivers', label: 'Drivers' },
        { key: 'assign', label: 'Assign Driver' },
        { key: 'audit', label: 'Audit Logs' },
    ]

    return (
        <div className="ff-page">
            <header className="ff-navbar">
                <span className="ff-navbar-brand">FleetFlow</span>
                <div className="ff-navbar-right">
                    {user && (
                        <span className="ff-navbar-user">
                            Welcome, <strong>{user.username}</strong>
                        </span>
                    )}
                    <button className="btn btn-ghost" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="ff-main">
                <div className="ff-page-header">
                    <h2>Admin Dashboard</h2>
                    <p className="ff-page-subtitle">Manage orders, drivers, and operations</p>
                </div>

                {error && <p className="msg-error">{error}</p>}

                <div className="ff-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`ff-tab${activeTab === tab.key ? ' active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'orders' && (
                    <div>
                        <div className="ff-section-header">
                            <h3>All Orders</h3>
                        </div>
                        {orders.length === 0 ? (
                            <div className="ff-empty">No orders found.</div>
                        ) : (
                            <div className="ff-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Pickup</th>
                                            <th>Delivery</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order.id}>
                                                <td className="ff-cell-id">#{order.id}</td>
                                                <td>{order.customer_username}</td>
                                                <td>{order.pickup_location}</td>
                                                <td>{order.delivery_location}</td>
                                                <td>
                                                    <span className={statusBadgeClass(order.status)}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleViewHistory(order.id)}
                                                    >
                                                        History
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {orderHistory && (
                            <div className="ff-panel">
                                <div className="ff-panel-row-sm">
                                    <h4>
                                        Order #{orderHistory.order_id}
                                        <span className="ff-panel-badge">
                                            <span className={statusBadgeClass(orderHistory.current_status)}>
                                                {orderHistory.current_status}
                                            </span>
                                        </span>
                                    </h4>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setOrderHistory(null)}
                                    >
                                        Close
                                    </button>
                                </div>

                                <h5>Tracking Events</h5>
                                {orderHistory.tracking_events && orderHistory.tracking_events.length > 0 ? (
                                    <ul className="ff-tracking-list">
                                        {orderHistory.tracking_events.map(e => (
                                            <li key={e.id}>
                                                <strong>{e.event_type}</strong>
                                                <span className="ff-event-time">{new Date(e.timestamp).toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="ff-text-faint">No tracking events.</p>
                                )}

                                <h5>Assignments</h5>
                                {orderHistory.assignments && orderHistory.assignments.length > 0 ? (
                                    <ul className="ff-quick-list">
                                        {orderHistory.assignments.map(a => (
                                            <li key={a.id}>
                                                <strong>{a.driver_name}</strong>
                                                <span className="ff-assignment-meta">
                                                    {a.status} — {new Date(a.assigned_at).toLocaleString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="ff-text-faint">No assignments.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'drivers' && (
                    <div>
                        <div className="ff-section-header">
                            <h3>All Drivers</h3>
                        </div>
                        {drivers.length === 0 ? (
                            <div className="ff-empty">No drivers found.</div>
                        ) : (
                            <div className="ff-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th>Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers.map(driver => (
                                            <tr key={driver.id}>
                                                <td className="ff-cell-id">#{driver.id}</td>
                                                <td>{driver.name}</td>
                                                <td className="ff-cell-dim">{driver.phone_number}</td>
                                                <td>
                                                    <span className={statusBadgeClass(driver.status)}>
                                                        {driver.status}
                                                    </span>
                                                </td>
                                                <td className="ff-cell-muted">{driver.current_location || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assign' && (
                    <div>
                        <div className="ff-section-header-md">
                            <h3>Assign Driver to Order</h3>
                        </div>

                        <div className="ff-card ff-assign-card">
                            <form onSubmit={handleAssignDriver}>
                                <div className="form-group">
                                    <label>Order ID</label>
                                    <input
                                        type="number"
                                        value={assignForm.order_id}
                                        onChange={e => setAssignForm({ ...assignForm, order_id: e.target.value })}
                                        placeholder="Enter order ID"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Driver ID</label>
                                    <input
                                        type="number"
                                        value={assignForm.driver_id}
                                        onChange={e => setAssignForm({ ...assignForm, driver_id: e.target.value })}
                                        placeholder="Enter driver ID"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    Assign Driver
                                </button>
                            </form>

                            {assignMessage && (
                                <p className={assignMessage.toLowerCase().includes('success') ? 'msg-success' : 'msg-error'}>
                                    {assignMessage}
                                </p>
                            )}
                        </div>

                        <div className="ff-assign-cols">
                            <div>
                                <p className="ff-section-title ff-section-title-top">Available Drivers</p>
                                {drivers.filter(d => d.status === 'available').length === 0 ? (
                                    <p className="ff-text-faint">No available drivers.</p>
                                ) : (
                                    <ul className="ff-quick-list">
                                        {drivers.filter(d => d.status === 'available').map(d => (
                                            <li key={d.id}>
                                                <span className="ff-ql-id">#{d.id}</span>
                                                <strong className="ff-ql-name">{d.name}</strong>
                                                <span className="ff-ql-meta">({d.phone_number})</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <p className="ff-section-title ff-section-title-top">Pending Orders</p>
                                {orders.filter(o => o.status === 'created').length === 0 ? (
                                    <p className="ff-text-faint">No pending orders.</p>
                                ) : (
                                    <ul className="ff-quick-list">
                                        {orders.filter(o => o.status === 'created').map(o => (
                                            <li key={o.id}>
                                                <span className="ff-ql-id">#{o.id}</span>
                                                <span className="ff-ql-route">
                                                    {o.pickup_location} &rarr; {o.delivery_location}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div>
                        <div className="ff-section-header">
                            <h3>Audit Logs</h3>
                        </div>
                        {auditLogs.length === 0 ? (
                            <div className="ff-empty">No audit logs found.</div>
                        ) : (
                            <div className="ff-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>User</th>
                                            <th>Action</th>
                                            <th>Entity</th>
                                            <th>ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.map(log => (
                                            <tr key={log.id}>
                                                <td className="ff-cell-timestamp">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td>{log.performed_by}</td>
                                                <td>
                                                    <span className="badge badge-active badge-action">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="ff-cell-dim">{log.entity_type}</td>
                                                <td className="ff-cell-id">{log.entity_id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

export default Dashboard
