import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './main.css';
import './styles/troop-theme.css';
import './styles/responsive-overrides.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './Utils/queryClient';

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);
