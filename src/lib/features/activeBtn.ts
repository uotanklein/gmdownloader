import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const activeBtnSlice = createSlice({
    name: 'activeBtn',
    initialState: { activeBtn: 0 },
    reducers: {
        activeBtn(state, act: PayloadAction<number>) {
            state.activeBtn = act.payload;
        },
    },
});

export const { activeBtn } = activeBtnSlice.actions;
export default activeBtnSlice.reducer;
