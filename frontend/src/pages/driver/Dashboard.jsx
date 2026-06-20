import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import './DriverDashboard.css'

const NEXT_STATUS = {
    assigned: 'accepted',
    accepted: 'picked_up',
    picked_up: 'in_transit',
    in_transit: 'delivered',
}

function statusBadgeClass(status) {
    if (!status) return 'badge badge-pending'
    const s = status.toLowerCase()
    if (s === 'delivered') return 'badge badge-delivered'
    if (s === 'assigned') return 'badge badge-pending'
    return 'badge badge-active'
}

function Dashboard() {
    const [assignments, setAssignments] = useState([])
    const [user, setUser] = useState(null)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('access')
        if (!token) { navigate('/login'); return }

        api.get('/users/me/')
            .then(res => setUser(res.data))
            .catch(() => navigate('/login'))

        fetchAssignments()
    }, [navigate])

    function fetchAssignments() {
        api.get('/deliveries/my-deliveries/')
            .then(res => setAssignments(res.data))
            .catch(() => setError('Failed to load deliveries.'))
    }

    async function handleUpdateStatus(orderId, currentStatus) {
        const nextStatus = NEXT_STATUS[currentStatus]
        if (!nextStatus) return

        try {
            await api.post('/deliveries/update-status/', {
                order_id: orderId,
                status: nextStatus
            })
            fetchAssignments()
        } catch {
            setError('Failed to update status.')
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
                    <h2>Driver Dashboard</h2>
                    <p className="ff-page-subtitle">View and manage your assigned deliveries</p>
                </div>

                {error && <p className="msg-error">{error}</p>}

                <div className="ff-section-header">
                    <h3>My Deliveries</h3>
                </div>

                {assignments.length === 0 ? (
                    <div className="ff-empty">No deliveries assigned yet.</div>
                ) : (
                    <div className="ff-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Order Status</th>
                                    <th>Assignment Status</th>
                                    <th>Driver</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(assignment => (
                                    <tr key={assignment.id}>
                                        <td className="ff-cell-id">#{assignment.order}</td>
                                        <td>
                                            <span className={statusBadgeClass(assignment.order_status)}>
                                                {assignment.order_status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={statusBadgeClass(assignment.status)}>
                                                {assignment.status}
                                            </span>
                                        </td>
                                        <td className="ff-cell-secondary">{assignment.driver_name}</td>
                                        <td>
                                            {NEXT_STATUS[assignment.status] ? (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleUpdateStatus(assignment.order, assignment.status)}
                                                >
                                                    Mark as {NEXT_STATUS[assignment.status].replace('_', ' ')}
                                                </button>
                                            ) : (
                                                <span className="badge badge-delivered">Completed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    )
}

export default Dashboard
