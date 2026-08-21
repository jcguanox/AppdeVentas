import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();


    const userRole = localStorage.getItem('userRole');
    const fullname = localStorage.getItem('fullname') || 'Usuario';

    const isAdmin = userRole === 'admin';

    const handleLogout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('cedula');
        localStorage.removeItem('userRole');
        localStorage.removeItem('fullname');
        navigate('/login');
    };

    return (
        <div className="homepage-container">
            <h1 className="homepage-title">MiniMarket Mayte</h1>
            <div className="section-links">

                <Link to="/products" className="section-card">
                    <i className="bi bi-basket-fill section-icon"></i>
                    <span className="section-text">Menú</span>
                </Link>

                {isAdmin && (
                    <>
                        <Link to="/reports" className="section-card">
                            <i className="bi bi-bar-chart-fill section-icon"></i>
                            <span className="section-text">Reportería</span>
                        </Link>
                        <Link to="/inventarios" className="section-card">
                            <i className="bi bi-boxes section-icon"></i>
                            <span className="section-text">Inventarios</span>
                        </Link>
                        <Link to="/staff" className="section-card">
                            <i className="bi bi-people-fill section-icon"></i>
                            <span className="section-text">Personal</span>
                        </Link>
                        <Link to="/bitacora" className="section-card">
                            <i className="bi bi-journal-text section-icon"></i>
                            <span className="section-text">Bitácora</span>
                        </Link>
                    </>
                )}
            </div>


            <div className="user-logout-container">
                <div className="user-info">
                    <i className="bi bi-person-circle"></i>
                    <span>{fullname}</span>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </div>
    );
};

export default HomePage;