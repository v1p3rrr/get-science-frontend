import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';
import './sentry';
import * as Sentry from '@sentry/react';

// Отключаем предупреждения ResizeObserver
const originalError = console.error;
console.error = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ResizeObserver') || args[0].includes('ResizeObserver loop'))
  ) {
    return;
  }
  originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ResizeObserver') || args[0].includes('ResizeObserver loop'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

ReactDOM.render(
    <Provider store={store}>
        <Sentry.ErrorBoundary fallback={<p>Произошла непредвиденная ошибка. Пожалуйста, перезагрузите страницу.</p>}>
            <App />
        </Sentry.ErrorBoundary>
    </Provider>,
    document.getElementById('root')
);
