const { Server } = require("socket.io");

global.io = global.io || null;

function initSocket(server) {
  if (!global.io) {
    global.io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    global.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join-form", (formId) => {
        socket.join(formId);
        console.log("Socket joined form room:", formId);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }

  return global.io;
}

function getIO() {
  return global.io;
}

module.exports = {
  initSocket,
  getIO,
};