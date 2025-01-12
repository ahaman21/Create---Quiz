import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { QuizTimerProvider } from './contexts/QuizTimerContext';
import {Provider} from 'react-redux';
import store from './store/index';
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <Provider store={store}>
    <QuizTimerProvider>
      <AuthProvider>
        <BrowserRouter>
            <App />
      </BrowserRouter>
      </AuthProvider>
    </QuizTimerProvider>
    </Provider>
);