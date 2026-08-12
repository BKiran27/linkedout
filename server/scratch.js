const http = require('http');

const data = JSON.stringify({ username: 'testuser1', password: 'password123' });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('LOGIN:', res.statusCode, body));
});

req.write(data);
req.end();
