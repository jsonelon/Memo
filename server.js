const http = require('http');


const server = http.createServer((req, res) => {
  // 打印params
  let url = req.url
  let params = url.split('?')[1]

  let str = ''
  if (params) {
    str = decodeURIComponent(params);
  }

  // console.log(params);
  console.log(str);

  res.end('Hello World');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});