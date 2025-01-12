import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  currentUser: any | null;
  loading: boolean;
}

const initialState: UserState = {
  currentUser: null,
  loading: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<any>) {
      const { proactiveRefresh, ...serializableUser } = action.payload || {};
      state.currentUser = serializableUser; // Store only serializable properties
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setCurrentUser, setLoading } = userSlice.actions;
export default userSlice.reducer;
