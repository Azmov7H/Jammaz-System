const http = require('http');
const fs = require('fs');

const url = 'http://localhost:3000/api/auth/debug-save';

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const output = `Status Code: ${res.statusCode}\nBody: ${data}`;
        fs.writeFileSync('debug-log.txt', output);
        console.log('Done writing to debug-log.txt');
    });
}).on('error', (err) => {
    fs.writeFileSync('debug-log.txt', `Error: ${err.message}`);
});
