var DEBUG = true;
var PORT = 3000;


var app = require('express')(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);

server.listen(PORT)

/** Setup express web server */
app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});





/** Setup Redis store for socket.io */
/*
var redis = require('socket.io/node_modules/redis');
var RedisStore = require('socket.io/lib/stores/redis'),
  redis = require('socket.io/node_modules/redis'),
  pub = redis.createClient(),
  sub = redis.createClient(),
  client = redis.createClient();

pub.auth(password, function(err) {
  if (err) throw err;
});
sub.auth(password, function(err) {
  if (err) throw err;
});
client.auth(password, function(err) {
  if (err) throw err;
});

io.set('store', new RedisStore({
  redis: redis,
  redisPub: pub,
  redisSub: sub,
  redisClient: client
}));

createClient(port, hostname, options)
*/


/**
 * socket.io
 */
io.sockets.on('connection', function(socket) {
  // join the room and send back some initial info
  // DEBUGGING, should be gotten from inital connection handshake and auth
  data = {
    room: socket.handshake.query.r
  }
  console.log(' --- ' + socket.id + ' wants to join room ' + data.room);
  socket.room = data.room; // use socket.set() instead?
  var members = io.sockets.clients(socket.room);

  if (members.length >= 2) {
    // room is full
    var response = {
      type: 'hello',
      id: socket.id,
      error: "full",
      makeOffer: false,
    };
    socket.emit('message', response);
  } else {
    socket.join(socket.room);
    var members = io.sockets.clients(socket.room);
    var response = {
      type: 'hello',
      id: socket.id,
      makeOffer: members.length == 2, // there is someone else in the room
    };
    socket.emit('message', response);

    // notify room that a new client has connected
    var response = {
      type: 'client-connected',
      id: socket.id,
    };
    socket.broadcast.to(socket.room).emit('message', response);
  }

  // relay messages from one client to another
  socket.on('message', function(data) {
    data.from = socket.id; // disallow source forgery


    //TODO DEBUG just broadcast all messages for now
    socket.broadcast.to(socket.room).emit('message', data);
    return;


    if (data.type == 'hello') {
      return; // only server allowed to send 'hello' messages
    }

    if (data.broadcast) {
      socket.broadcast.to(socket.room).emit('message', data);
    } else {
      io.sockets.socket(data.to).emit('message', data);
    }
  });

  socket.on('disconnect', function() {
    // notify room that a client has disconnected
    var response = {
      type: 'client-disconnected',
      id: socket.id,
    };
    socket.broadcast.to(socket.room).emit('message', response);

    console.log('-- END connection: ' + socket.id);
  });

}); // end socket.on
