import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import './CustomerDashboard.css'

function statusBadgeClass(status) {
    if (!status) return 'badge badge-pending'
    const s = status.toLowerCase()
    if (s === 'created' || s === 'pending') return 'badge badge-created'
    if (s === 'delivered' || s === 'done') return 'badge badge-delivered'
    return 'badge badge-active'
}

function Dashboard() {
    const [orders, setOrders] = useState([])
    const [user, setUser] = useState(null)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({ pickup_location: '', delivery_location: '' })
    const [tracking, setTracking] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('access')
        if (!token) { navigate('/login'); return }

        api.get('/users/me/')
            .then(res => setUser(res.data))
            .catch(() => navigate('/login'))

        fetchOrders()
    }, [navigate])

    function fetchOrders() {
        api.get('/orders/')
            .then(res => setOrders(res.data))
            .catch(() => setError('Failed to load orders.'))
    }

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    async function handleCreateOrder(e) {
        e.preventDefault()
        try {
            await api.post('/orders/create/', formData)
            setFormData({ pickup_location: '', delivery_location: '' })
            fetchOrders()
        } catch {
            setError('Failed to create order.')
        }
    }

    async function handleTrack(orderId) {
        try {
            const res = await api.get(`/orders/${orderId}/tracking/`)
            setTracking(res.data)
        } catch {
            setError('Failed to load tracking.')
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
                    <h2>Customer Dashboard</h2>
                    <p className="ff-page-subtitle">Manage your delivery orders</p>
                </div>

                {error && <p className="msg-error">{error}</p>}

                <div className="ff-card">
                    <p className="ff-section-title">New Order</p>
                    <form onSubmit={handleCreateOrder}>
                        <div className="ff-form-row">
                            <div className="form-group">
                                <label>Pickup Location</label>
                                <input
                                    type="text"
                                    name="pickup_location"
                                    placeholder="e.g. 12 Main St, City"
                                    value={formData.pickup_location}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Delivery Location</label>
                                <input
                                    type="text"
                                    name="delivery_location"
                                    placeholder="e.g. 45 Park Ave, City"
                                    value={formData.delivery_location}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="ff-form-submit">
                                <button type="submit" className="btn btn-primary">
                                    Place Order
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="ff-section-header">
                    <h3>My Orders</h3>
                </div>

                {orders.length === 0 ? (
                    <div className="ff-empty">No orders yet. Place your first order above.</div>
                ) : (
                    <div className="ff-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
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
                                                onClick={() => handleTrack(order.id)}
                                            >
                                                Track
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tracking && (
                    <div className="ff-panel">
                        <div className="ff-panel-row">
                            <h4>Tracking — Order #{tracking.order_id}</h4>
                            <button className="btn btn-secondary btn-sm" onClick={() => setTracking(null)}>
                                Close
                            </button>
                        </div>
                        {tracking.tracking && tracking.tracking.length > 0 ? (
                            <ul className="ff-tracking-list">
                                {tracking.tracking.map(event => (
                                    <li key={event.id}>
                                        <strong>{event.event_type}</strong>
                                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="ff-text-muted-sm">No tracking events yet.</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

export default Dashboard
