import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import './Auth.css'

function Login(){

    const [formData,setFormData] = useState({
        username : '',
        password : ''
    })
    const [error,setError] = useState('')
    const navigate = useNavigate()

    function handleChange(e){
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    async function handleSubmit(e){
        e.preventDefault()
        setError('')

        try{
            const response = await api.post('/token/',formData)
            localStorage.setItem('access',response.data.access)
            localStorage.setItem('refresh',response.data.refresh)

            const identity = await api.get('/users/me/')
            const role = identity.data.role
            localStorage.setItem('role', role)
            if (role === 'admin') navigate('/admin/dashboard')
            else if (role === 'driver') navigate('/driver/dashboard')
            else if (role === 'customer') navigate('/customer/dashboard')
            else navigate('/customer/dashboard')
        }
        catch(e){
            setError('invalid email or password')
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <div className="ff-auth-header">
                    <span className="ff-auth-brand">FleetFlow</span>
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">Log in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter your username"
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
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        Sign In
                    </button>
                </form>

                {error && <p className="msg-error">{error}</p>}

                <div className="auth-footer">
                    Don't have an account? <a href="/register">Sign up</a>
                </div>
            </div>
        </div>
    )
}

export default Login
