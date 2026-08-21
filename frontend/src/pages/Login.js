import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/AuthStyles.css';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importar íconos de ojito
import logo from '../resources/logoDelValle.png';
const Login = () => {
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);                                                        
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!cedula || !password) {
            toast.error('Por favor, completa todos los campos.', {
                position: 'top-right',
                autoClose: 3000,
                className: 'custom-toast-error',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/usuarios/login', {
                cedula,
                password,
            });

            const userData = response.data;

            if (response.status === 200) {
                if (userData.active) {
                    localStorage.setItem('userId', userData.id);
                    localStorage.setItem('cedula', userData.cedula);
                    localStorage.setItem('userRole', userData.role);
                    localStorage.setItem('fullname', userData.fullname);
                    localStorage.setItem('active', userData.active);

                    navigate('/homepage');
                } else {
                    toast.error('Tu cuenta no está activa. Por favor, contacta al administrador.', {
                        position: 'top-right',
                        autoClose: 3000,
                        className: 'custom-toast-error',
                    });
                }
            } else {
                toast.error('Nombre de usuario o contraseña incorrectos.', {
                    position: 'top-right',
                    autoClose: 3000,
                    className: 'custom-toast-error',
                });
            }
        } catch (error) {
            toast.error('Error en el inicio de sesión. Verifica tus credenciales.', {
                position: 'top-right',
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCedulaChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Solo permite números
        setCedula(value);
    };

    return (
        <div className="auth-container">
            <div className="form-container-modern">
                <div className="form-content">
                    <img
                        src={logo}
                        alt="Logo"
                        className="logo-image"
                    />
                    <h1>Iniciar Sesión</h1>
                    <p>Bienvenido, por favor ingresa tus credenciales</p>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="cedula">Cédula</label>
                            <input
                                id="cedula"
                                type="text"
                                placeholder="Ingresa tu cédula"
                                value={cedula}
                                onChange={handleCedulaChange}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Contraseña</label>
                            <div className="password-input">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Ingresa tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span
                                    className="show-password-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>
                        <button id="login" type="submit" disabled={loading}>
                            {loading ? 'Cargando...' : 'Inicia sesión'}
                        </button>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => navigate('/register')}
                        >
                            Regístrate
                        </button>
                    </form>
                </div>
            </div>

            <div className="video-container">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                >
                    <source
                        src="https://res.cloudinary.com/db88ukpit/video/upload/v1735957908/xd9impudludr0saulbtu.mp4"
                        type="video/mp4"
                    />
                    Tu navegador no soporta el elemento <code>video</code>.
                </video>
            </div>

            <ToastContainer />
        </div>
    );
};

export default Login;