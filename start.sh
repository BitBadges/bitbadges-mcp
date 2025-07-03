#!/bin/sh
# Start both the HTTP server and web interface
pm2 start /app/dist/http-server.js --name "http-server"
pm2 start /app/web-interface/dist/server.js --name "web-interface"
pm2 logs --lines 50