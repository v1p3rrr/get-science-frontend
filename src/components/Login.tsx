import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../auth/authAPI';
import { saveToken } from "../auth/auth";
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { t } = useTranslation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = await loginUser({ email, password });
            saveToken(token);
            navigate('/events');
        } catch (error) {
            alert(t('login_failed'));
        }
    };

    return (
        <div className="container">
            <div className="form-container">
                <form onSubmit={handleLogin}>
                    <div>
                        <label>{t('email')}:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label>{t('password')}:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit">{t('login')}</button>
                </form>
                <p>{t('no_account')} <Link to="/register">{t('register')}</Link></p>
            </div>
        </div>
    );
};

export default Login;
