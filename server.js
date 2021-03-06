//requires
const crypto = require('crypto')
var fs = require('fs');
const express = require('express');
const app = express();
var http = require('http');
var https = require('https');

var privateKey = fs.readFileSync('./certificates/privatekey.pem').toString();
var certificate = fs.readFileSync('./certificates/certificate.pem').toString();

var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);


var io = require('socket.io')(httpsServer);
// const port = process.env.PORT || 7777;

// express routing
app.use(express.static('public'));


// signaling
io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('create or join', function (room) {
        console.log('create or join to room ', room);
        
        var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
        var numClients = myRoom.length;

        console.log(room, ' has ', numClients, ' clients');

        if (numClients == 0) {
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients == 1) {
            socket.join(room);
            socket.emit('joined', room);
        } else {
            socket.emit('full', room);
        }
    });

    socket.on('ready', function (room){
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('candidate', function (event){
        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('offer', function(event){
        socket.broadcast.to(event.room).emit('offer',event.sdp);
    });

    socket.on('answer', function(event){
        socket.broadcast.to(event.room).emit('answer',event.sdp);
    });

});



// listener
httpServer.listen(7000, function () {
    console.log('listening on', 7000);
});

httpsServer.listen(7433, function () {
    console.log('HTTPS listening on', 7433);
});