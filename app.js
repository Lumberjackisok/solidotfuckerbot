const express = require('express');
const cors = require('cors');
const solidotBot = require('./routes/solidotBot');
const app = express();

//解析客户端发送的json数据(req.body)，只能解析Content-Type:application/json的数据
app.use(express.json());

//使用qs模块解析query传参x-www-form-urlencoded的数据
app.use(express.urlencoded({ extended: true }));

//跨域解决
app.use(cors());

//路由
app.use(solidotBot);

//错误处理
const errorHandlers = require('./handler/errorHandler');
app.use(errorHandlers.notFound);
app.use(errorHandlers.mongoseErrors);
if (process.env.ENV === "DEVELOPMENT") {
  app.use(errorHandlers.developmentErrors);
} else {
  app.use(errorHandlers.productionErrors);
}

module.exports = app;