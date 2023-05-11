var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);

server.listen(3000);

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/index.html");
});

app.get("/css/style.css", function (req, res) {
  res.setHeader("Content-Type", "text/css");
  res.sendFile(__dirname + "/css/style.css");
});

var users = {};
var connections = [];
var colors = ["20c73f", "374bc9", "c9a037", "c937b1"];
var chatHistory = []; // Хранение истории сообщений

io.on("connection", function (socket) {
  console.log("Connected");
  connections.push(socket);

  socket.on("disconnect", function (data) {
    connections.splice(connections.indexOf(socket), 1);
    console.log("Disconnected");

    // Удаление пользователя из списка пользователей при отключении
    for (var user in users) {
      if (users[user].socketId === socket.id) {
        delete users[user];
        break;
      }
    }
  });

  // Отправка истории сообщений новому пользователю при подключении
  socket.emit("chat history", chatHistory);

  socket.on("send message", (data) => {
    if (data.name in users) {
      io.emit("add message", {
        name: data.name,
        msg: data.msg,
        color: users[data.name].color,
      });
    } else {
      let newColor = "";
      for (const color of colors) {
        let occupiedColor = false;
        for (const user in users) {
          if (users[user].color === color) {
            occupiedColor = true;
            break;
          }
        }
        if (!occupiedColor) {
          newColor = color;
          break;
        }
      }

      users[data.name] = {
        socketId: socket.id,
        color: newColor,
      };

      io.emit("add message", {
        name: data.name,
        msg: data.msg,
        color: newColor,
      });
    }

    // Сохранение сообщения в истории
    chatHistory.push({
      name: data.name,
      msg: data.msg,
      color: users[data.name].color,
    });

    // Ограничение истории сообщений до 10 последних сообщений
    if (chatHistory.length > 10) {
      chatHistory.shift();
    }
  });
});
