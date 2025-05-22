import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';

// Получаем сохраненный язык или используем русский по умолчанию
const storedLanguage = localStorage.getItem('selectedLanguage');
const defaultLanguage = 'ru'; // Ваш язык по умолчанию

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        ru: { translation: ru }
    },
    lng: storedLanguage || defaultLanguage, // Используем сохраненный язык или язык по умолчанию
    fallbackLng: defaultLanguage, // Язык, если текущий язык не найден
    interpolation: {
        escapeValue: false
    }
});

export default i18n;
