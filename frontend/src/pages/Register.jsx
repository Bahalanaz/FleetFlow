import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './Auth.css'

function Register() {
    const [formData, setFormData] = useState({ username: '', password: '', password2: '' })
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setMessage('')
        setError('')

        try {
            await api.post('/users/register/', formData)
            setMessage('Account created successfully.')
            setTimeout(() => navigate('/login'), 1500)
        } catch (err) {
            setError(
                err.response?.data?.username?.[0] ||
                err.response?.data?.password?.[0] ||
                'Registration failed. Please try again.'
            )
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <div className="ff-auth-header">
                    <span className="ff-auth-brand">FleetFlow</span>
                    <h2>Create Account</h2>
                    <p className="auth-subtitle">Sign up to get started</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        Create Account
                    </button>
                </form>

                {message && <p className="msg-success">{message}</p>}
                {error && <p className="msg-error">{error}</p>}

                <div className="auth-footer">
                    Already have an account? <a href="/login">Sign in</a>
                </div>
            </div>
        </div>
    )
}

export default Register
