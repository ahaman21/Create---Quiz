import { configureStore } from '@reduxjs/toolkit';
import quizReducer from './quizSlice';
import userReducer from './userSlice';

const store = configureStore({
  reducer: {
    quiz: quizReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
