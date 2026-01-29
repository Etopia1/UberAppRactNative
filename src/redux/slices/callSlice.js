import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    activeCall: null, // { otherUser, callType, isIncoming, status, duration }
    isMinimized: false,
};

const callSlice = createSlice({
    name: 'call',
    initialState,
    reducers: {
        setCall: (state, action) => {
            state.activeCall = action.payload;
            state.isMinimized = false;
        },
        updateCallStatus: (state, action) => {
            if (state.activeCall) {
                state.activeCall.status = action.payload;
            }
        },
        updateCallDuration: (state, action) => {
            if (state.activeCall) {
                state.activeCall.duration = action.payload;
            }
        },
        setMinimized: (state, action) => {
            state.isMinimized = action.payload;
        },
        endCallState: (state) => {
            state.activeCall = null;
            state.isMinimized = false;
        },
    },
});

export const { setCall, updateCallStatus, updateCallDuration, setMinimized, endCallState } = callSlice.actions;
export default callSlice.reducer;
