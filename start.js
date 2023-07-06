const app = require("./app");
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("终端打印:Listening on port:", port);
});