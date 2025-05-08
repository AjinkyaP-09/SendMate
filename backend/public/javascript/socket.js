const socket = io();

// Emit a new message to the server
const messageForm = document.querySelector("form");
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const messageInput = document.querySelector("input[name='message']");
  const message = messageInput.value;

  const postId = messageForm.querySelector("input[name='postId']").value;
  const senderId = messageForm.querySelector("input[name='senderId']").value;
  const receiverId = messageForm.querySelector(
    "input[name='receiverId']"
  ).value;

  // Emit the message to the server
  socket.emit("new_message", postId, senderId, receiverId, message);

  // Clear the input field after sending
  messageInput.value = "";
});

// Listen for new messages
socket.on("new_message", (postId, senderId, message) => {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML += `<div class="received">${message}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
});
