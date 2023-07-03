const http = require('http');
const { spawn } = require('child_process');

// 启动服务器
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Server is running.');
});

// 启动代码
const runCode = () => {
  const child = spawn('node', ['rssForwarder.js']);

  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

// 启动服务器并运行代码
server.listen(3000, 'localhost', () => {
  console.log('Server is running.');
  runCode();
});