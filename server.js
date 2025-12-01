const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

http.createServer(function (request, response) {
    console.log('request ', request.url);

    // API Handling
    if (request.url.startsWith('/api/notices')) {
        const noticesFile = path.join(__dirname, 'notices.json');

        if (request.method === 'GET') {
            fs.readFile(noticesFile, 'utf8', (err, data) => {
                if (err) {
                    // If file doesn't exist, return empty array
                    if (err.code === 'ENOENT') {
                        response.writeHead(200, { 'Content-Type': 'application/json' });
                        response.end('[]');
                        return;
                    }
                    response.writeHead(500);
                    response.end(JSON.stringify({ error: 'Failed to read notices' }));
                    return;
                }
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(data || '[]');
            });
            return;
        }

        if (request.method === 'POST') {
            let body = '';
            request.on('data', chunk => { body += chunk.toString(); });
            request.on('end', () => {
                try {
                    const newNotice = JSON.parse(body);
                    fs.readFile(noticesFile, 'utf8', (err, data) => {
                        const notices = data ? JSON.parse(data) : [];
                        notices.unshift(newNotice);
                        fs.writeFile(noticesFile, JSON.stringify(notices, null, 2), (err) => {
                            if (err) {
                                response.writeHead(500);
                                response.end(JSON.stringify({ error: 'Failed to save notice' }));
                                return;
                            }
                            response.writeHead(200, { 'Content-Type': 'application/json' });
                            response.end(JSON.stringify(newNotice));
                        });
                    });
                } catch (e) {
                    response.writeHead(400);
                    response.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            return;
        }

        if (request.method === 'PUT') {
            const id = parseInt(request.url.split('/').pop());
            let body = '';
            request.on('data', chunk => { body += chunk.toString(); });
            request.on('end', () => {
                try {
                    const updatedData = JSON.parse(body);
                    fs.readFile(noticesFile, 'utf8', (err, data) => {
                        let notices = data ? JSON.parse(data) : [];
                        const index = notices.findIndex(n => n.id === id);
                        if (index !== -1) {
                            notices[index] = { ...notices[index], ...updatedData };
                            fs.writeFile(noticesFile, JSON.stringify(notices, null, 2), (err) => {
                                if (err) {
                                    response.writeHead(500);
                                    response.end(JSON.stringify({ error: 'Failed to save' }));
                                    return;
                                }
                                response.writeHead(200, { 'Content-Type': 'application/json' });
                                response.end(JSON.stringify(notices[index]));
                            });
                        } else {
                            response.writeHead(404);
                            response.end(JSON.stringify({ error: 'Notice not found' }));
                        }
                    });
                } catch (e) {
                    response.writeHead(400);
                    response.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            return;
        }

        if (request.method === 'DELETE') {
            const id = parseInt(request.url.split('/').pop());
            fs.readFile(noticesFile, 'utf8', (err, data) => {
                let notices = data ? JSON.parse(data) : [];
                const initialLength = notices.length;
                notices = notices.filter(n => n.id !== id);

                if (notices.length === initialLength) {
                    response.writeHead(404);
                    response.end(JSON.stringify({ error: 'Notice not found' }));
                    return;
                }

                fs.writeFile(noticesFile, JSON.stringify(notices, null, 2), (err) => {
                    if (err) {
                        response.writeHead(500);
                        response.end(JSON.stringify({ error: 'Failed to delete' }));
                        return;
                    }
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ success: true }));
                });
            });
            return;
        }
    }

    let filePath = '.' + request.url;
    if (filePath == './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', function (error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(port);

console.log(`Server running at http://127.0.0.1:${port}/`);
