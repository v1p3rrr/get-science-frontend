import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {getToken, getUserRoles} from '../auth/auth';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';

const Sidebar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const token = getToken();
    const roles = getUserRoles();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="sidebar">
            <ul>
                {!token && <li><Link to="/login">{t('login')}</Link></li>}
                {!token && <li><Link to="/register">{t('register')}</Link></li>}
                <li><Link to="/events">{t('events_list')}</Link></li>
                {token && roles.includes('ORGANIZER') && <li><Link to="/my-events">{t('my_events')}</Link></li>}
                {token && roles.includes('ORGANIZER') && <li><Link to="/organizer-applications">{t('organizer_applications')}</Link></li>}
                {token && roles.includes('USER') && <li><Link to="/my-applications">{t('my_applications')}</Link></li>}
                <li><Link to="/my-profile">{t('my_profile')}</Link></li>
            </ul>
            <div className="language-switch">
                <button onClick={() => changeLanguage('en')}>
                    EN
                    {/*<img src="../../public/images/us.svg" alt="English"/>*/}
                </button>
                <button onClick={() => changeLanguage('ru')}>
                    RU
                {/*<img src="../../public/images/ru.svg" alt="Russian" />*/}
                </button>
            </div>
            {token && (
                <div className="logout-button-container">
                    <button onClick={handleLogout} className="logout-button">
                        {t('log_out')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
