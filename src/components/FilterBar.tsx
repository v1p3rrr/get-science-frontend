import React, { useState } from 'react';
import { Event } from '../models/Models';
import { useTranslation } from 'react-i18next';
import {toSentenceCase} from "../util/utils";

interface FilterBarProps {
    events: Event[];
    onFilter: (filtered: Event[]) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ events, onFilter }) => {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('');
    const [theme, setTheme] = useState('');
    const [format, setFormat] = useState('');
    const [location, setLocation] = useState('');

    const { t } = useTranslation();

    const handleFilter = () => {
        const filtered = events.filter(event =>
            event.title.toLowerCase().includes(query.toLowerCase()) &&
            (type ? event.type === type : true) &&
            (theme ? event.theme === theme : true) &&
            (location ? event.location.toLowerCase().includes(location.toLowerCase()) : true)
        );
        onFilter(filtered);
    };

    const handleClearFilter = () => {
        setQuery('');
        setType('');
        setTheme('');
        setFormat('');
        setLocation('');
        onFilter(events); // Показать все мероприятия после очистки фильтров
    };

    return (
        <div className="filter-bar">
            <input
                type="text"
                placeholder={t('search_by_title')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">{t('all_types')}</option>
                {Array.from(new Set(events.map(event => event.type))).map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="">{t('all_themes')}</option>
                {Array.from(new Set(events.map(event => event.theme))).map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                ))}
            </select>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="">{t('all_formats')}</option>
                {Array.from(new Set(events.map(event => event.format))).map(format => (
                    <option key={format} value={format}>{toSentenceCase(format)}</option>
                ))}
            </select>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">{t('all_locations')}</option>
                {Array.from(new Set(events.map(event => event.location))).map(location => (
                    <option key={location} value={location}>{location}</option>
                ))}
            </select>
            <button onClick={handleFilter}>{t('search')}</button>
            <button onClick={handleClearFilter}>{t('clear_filter')}</button>
        </div>
    );
};

export default FilterBar;
