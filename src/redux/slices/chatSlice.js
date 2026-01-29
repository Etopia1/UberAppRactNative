import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    conversations: [],
    totalUnreadCount: 0,
    activeConversationId: null, // To know if we are currently reading a chat
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload;
            // Calculate total unread
            // Assuming payload has unreadCount per user logic processed or we pass specific count
            // We'll calculate it in the component or backend should trigger 'setTotalUnread'
        },
        setTotalUnreadCount: (state, action) => {
            state.totalUnreadCount = action.payload;
        },
        incrementUnreadCount: (state) => {
            state.totalUnreadCount += 1;
        },
        decrementUnreadCount: (state, action) => {
            const amount = action.payload || 1;
            state.totalUnreadCount = Math.max(0, state.totalUnreadCount - amount);
        },
        setActiveConversation: (state, action) => {
            state.activeConversationId = action.payload;
        },
        updateConversationLastMessage: (state, action) => {
            const { conversationId, message, unreadCountIncrement } = action.payload;
            const index = state.conversations.findIndex(c => c._id === conversationId);

            if (index !== -1) {
                const conversation = state.conversations[index];
                conversation.lastMessage = message.content;
                conversation.lastMessageTime = message.createdAt;

                // If it's a new unread message for us
                if (unreadCountIncrement) {
                    // Update internal conversation unread count if we track it deeply
                    // For now, simpler: just move it to top
                }

                // Move to top
                state.conversations.splice(index, 1);
                state.conversations.unshift(conversation);
            }
        }
    },
});

export const {
    setConversations,
    setTotalUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    setActiveConversation,
    updateConversationLastMessage
} = chatSlice.actions;

export default chatSlice.reducer;
