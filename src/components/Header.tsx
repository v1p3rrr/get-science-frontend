import React from 'react';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
    const { t } = useTranslation();

    return (
        <header>
            <h1>{t('event_management_system')}</h1>
        </header>
    );
};

export default Header;
