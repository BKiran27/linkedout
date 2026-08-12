const http = require('http');

const data = JSON.stringify({ username: 'testuser_new', password: 'password123' });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('REGISTER:', res.statusCode, body));
});

req.write(data);
req.end();
