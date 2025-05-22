import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/style.css';

const NotFound: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="not-found">
            <h2>{t('page_not_found')}</h2>
            <p>{t('sorry_page_not_exist')}</p>
            <Link to="/events">{t('go_to_events_list')}</Link>
        </div>
    );
};

export default NotFound;
