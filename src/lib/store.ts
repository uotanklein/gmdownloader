import { configureStore } from '@reduxjs/toolkit';
import activeBtnReducer from '@/lib/features/activeBtn';

export const makeStore = () => {
    return configureStore({
        reducer: {
            nav: activeBtnReducer,
        },
    });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
