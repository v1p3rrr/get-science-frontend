import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../auth/authAPI';
import { RoleTypes } from '../models/Models';
import { useTranslation } from 'react-i18next';
import '../styles/style.css';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isOrganizer, setIsOrganizer] = useState(false);
    const { t } = useTranslation();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const role = isOrganizer ? RoleTypes.ORGANIZER : RoleTypes.USER;
        try {
            await registerUser({
                firstName,
                lastName,
                role,
                email,
                password
            });
            navigate('/login');
        } catch (error) {
            alert(t('registration_failed'));
        }
    };

    return (
        <div className="container">
            <div className="form-container">
                <form onSubmit={handleRegister}>
                    <div>
                        <label>{t('first_name')}:</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                        <label>{t('last_name')}:</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                    <div>
                        <label>{t('email')}:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label>{t('password')}:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={isOrganizer}
                            onChange={(e) => setIsOrganizer(e.target.checked)}
                        />
                        <label>{t('register_as_organizer')}</label>
                    </div>
                    <button type="submit">{t('register')}
                    </button>
                </form>
                <p>{t('already_have_account')} <Link to="/login">{t('login')}</Link></p>
            </div>
        </div>
    );
};

export default Register;
