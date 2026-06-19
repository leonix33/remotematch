import { io } from 'socket.io-client';
import { ref } from 'vue';

const socket = ref(null);
const connected = ref(false);
const typingUser = ref('');

export function useSocket() {
  function connect() {
    const token = localStorage.getItem('accessToken');
    if (!token || socket.value?.connected) return socket.value;

    socket.value = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.value.on('connect', () => { connected.value = true; });
    socket.value.on('disconnect', () => { connected.value = false; });
    socket.value.on('typing', (data) => {
      typingUser.value = data.userName;
      setTimeout(() => { typingUser.value = ''; }, 2000);
    });

    return socket.value;
  }

  function disconnect() {
    socket.value?.disconnect();
    socket.value = null;
    connected.value = false;
  }

  function joinConversation(id) {
    socket.value?.emit('join_conversation', id);
  }

  function leaveConversation(id) {
    socket.value?.emit('leave_conversation', id);
  }

  function sendMessage(conversationId, content) {
    return new Promise((resolve, reject) => {
      if (!socket.value?.connected) return reject(new Error('Not connected'));
      socket.value.emit('send_message', { conversationId, content }, (res) => {
        if (res?.ok) resolve(res.message);
        else reject(new Error(res?.error || 'Send failed'));
      });
    });
  }

  function emitTyping(conversationId) {
    socket.value?.emit('typing', { conversationId });
  }

  function onNewMessage(cb) {
    const s = socket.value || connect();
    s?.on('new_message', cb);
    return () => s?.off('new_message', cb);
  }

  function onNotification(cb) {
    const s = socket.value || connect();
    s?.on('notification', cb);
    return () => s?.off('notification', cb);
  }

  return {
    socket,
    connected,
    typingUser,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitTyping,
    onNewMessage,
    onNotification,
  };
}
