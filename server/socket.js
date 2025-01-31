import { Server } from "socket.io";

class SocketServer {
  constructor(server) {
    if (server) this.io = new Server(server);
    else this.io = new Server();
    this.users = new Map();
    this.#initListeners();
  }

  #initListeners() {
    this.io.on("connection", (socket) => {
      const id = this.identifierCallback(socket.handshake.headers);
      const dispatchDelete = this.#store(id, socket);

      socket.on("disconnect", () => {
        dispatchDelete();
      });

      socket.on("message", (message) => {
        try {
          message = JSON.parse(message);
        } catch (e) {}

        this.listenToMessage(message, socket, id);
      });

      socket.on("getLeftOverMessages", () => {
        this.sendLeftOverMessage(id);
      });
    });
  }

  MessageListener(callback) {
    this.listenToMessage = callback;
  }

  #store(id, socket) {
    this.users.set(id, socket);
    return () => this.users.delete(id);
  }

  async dispatchMessageWithAk(message, toUsers, timeout, cb) {
    if (!toUsers) {
      try {
        await this.io.timeout(timeout || 2000).emitWithAck("message", message);
      } catch (err) {
        console.log("errors might occured in broadcast");
      }
      return;
    }
    const notSent = [];
    toUsers = Array.isArray(toUsers) ? toUsers : [toUsers];
    toUsers.forEach(async (userId) => {
      if (this.users.has(userId)) {
        this.users
          .get(userId)
          .timeout(2000)
          .emitWithAck("message", message)
          .then((res) => {
            if (cb) cb(userId, res);
          })
          .catch((err) => {
            notSent.push(userId);
            console.log("ack error : ", err);
          });
      } else notSent.push(userId);
    });
    this.storeInPresistor(notSent, message);
  }

  dispatchMessage(message, toUsers) {
    if (!toUsers) {
      this.io.emit("message", message);
      return;
    }
    toUsers = Array.isArray(toUsers) ? toUsers : [toUsers];
    toUsers.forEach((userId) => {
      if (this.users.has(userId))
        this.users.get(userId).emit("message", message);
    });
  }

  UserIdentifier(callback) {
    this.identifierCallback = callback;
  }

  Emit(event, data) {
    this.io.emit(event, data);
  }

  setPresistor(callback) {
    this.storeInPresistor = callback;
  }

  setLeftOverMessageCallback(callback) {
    this.sendLeftOverMessage = callback;
  }
}

export default SocketServer;
