import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer>
            <p>&copy; 2024 {t('event_management_system')}</p>
        </footer>
    );
};

export default Footer;
