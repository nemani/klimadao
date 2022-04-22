import { configureStore, ThunkAction, AnyAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

import userReducer from "./user";
import appReducer from "./app";

export const store = configureStore({
  reducer: {
    user: userReducer,
    app: appReducer,
  },
});

/** Type helpers */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type Thunk = ThunkAction<void, RootState, unknown, AnyAction>;
export const useAppDispatch = () => useDispatch<AppDispatch>();
