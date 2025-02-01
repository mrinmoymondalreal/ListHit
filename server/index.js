import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import SocketServer from "./socket.js";
import cookieParser from "cookie-parser";
import cookie from "cookie-parse";
import * as DB from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const socket = new SocketServer(server);

app.use(cookieParser());

let notSent = [];

// socket.setLeftOverMessageCallback (id)
// socket.UserIdentifier (userIds, messages)
// socket.MessageListener (message, socket, id)
// socket.dispatchMessageWithAk (message, toUsers)

socket.setPresistor((userIds, message) => {
  notSent.push([userIds, message]);
  userIds.forEach((userId) => {
    DB.addNotAckMessages(
      message.message.unique_id_parent,
      message.message.type,
      JSON.stringify(message),
      userId
    );
  });
});

socket.setLeftOverMessageCallback(async (id) => {
  // console.log(id, "wanting updates");
  // const messages = await DB.getNotAckMessages(id);
  // // console.log(messages);
  // if (messages.length > 0) console.log("sending messages to:", id);
  // messages.forEach(async ([message, id]) => {
  //   await socket.dispatchMessageWithAk(message, [id]);
  //   await DB.deleteNotAckMessages(id);
  // });
  // await DB.deleteNotAckMessages(id);
  // const messages = notSent.filter((msg) => msg[0].includes(id));
  // messages.forEach((msg) => {
  //   socket.dispatchMessageWithAk(msg[1], id);
  // });
  // notSent = notSent.filter((msg) => !msg[0].includes(id));
});

socket.UserIdentifier((headers) => {
  const cookies = cookie.parse(headers.cookie || "");
  const userId = cookies["userId"];
  return userId;
});

async function sendToUsers(listId, message, from) {
  const userIds = await DB.getAllUserIds(listId);

  if (userIds.length > 0)
    await socket.dispatchMessageWithAk(
      { from, message },
      userIds.filter((id) => id != from)
    );
}

socket.MessageListener((message, _socket, id) => {
  console.log("total users: ", socket.users.size);
  console.log("Recieved meessage from ", id, message);

  if (typeof message == "object") {
    sendToUsers(message.to, message.message, id);
    // socket.dispatchMessageWithAk(
    //   { from: id, message: message.message },
    //   message.to
    // );
  }
});

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/shared/list/:uniqueId", async (req, res) => {
  // Will work in Production
  if (req.body.fromUserId == req.body.userId) return res.send("success");

  await DB.addUserToList(
    [req.body.fromUserId, req.body.userId],
    req.params.uniqueId
  );

  const send = (function () {
    let isCalled = false;
    return (data, status) => {
      if (!isCalled) res.status(status || 200).send(data);
      isCalled = true;
    };
  })();

  let interval;

  await socket.dispatchMessageWithAk(
    {
      from: req.body.userId,
      message: {
        event: "provide_list",
        table: "lists",
        list_name: req.params.uniqueId,
      },
    },
    [req.body.fromUserId],
    10000,
    (toId, data) => {
      send(data);
      if (interval) clearInterval(interval);
    }
  );

  interval = setTimeout(() => send("failed", 500), 5000);
});

app.get("/shared/getLeftOverMessages", async (req, res) => {
  if (req.cookies.userId == undefined) return res.send("failed");
  const messages = await DB.getNotAckMessages(req.cookies.userId);
  console.log(req.cookies.userId, messages);

  res.send(messages);
});

app.post("/shared/deleteLeftOverMessages", async (req, res) => {
  if (req.cookies.userId == undefined) return res.send("failed");
  await DB.deleteNotAckMessages(req.cookies.userId);

  res.send("done");
});

app.get("/shared/delete/:listId", async (req, res) => {
  const listId = req.params.listId;
  await DB.deleteList(listId);

  res.send("done");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
