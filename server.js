var app = require('express')();
var http = require('http').Server(app);
var url = require("url");
var fs = require('fs');
var io = require('socket.io')(http);

/*----- Camera -----*/
var cv = require('opencv');
var Camera = function (num, fps_max) {
  var camera = new cv.VideoCapture(num); //open camera
  var image64;                   //base64 encoded image
  var latest_time = Date.now();  //latest capturing time
  var width = 320, height = 240; //image size

  /*--- Capture and store to "image64" ---*/
  var capture64 = function() {
    camera.read(function(err, im) {
        if (!err && im.size()[0] > 0 && im.size()[1] > 0){
          //resize
          if(width > 0 && height > 0){
            im.resize(width, height);
          }
          //store base64
          image64 = im.toBuffer().toString('base64');
        } else {
          console.log("Couldn't capture camera");
        }
    });
  };
  /* First capture */
  capture64();


  /*--- Capture and return image64 (the highest fps is 'fps_max') ---*/
  this.getImage64 = function() {
    if(Date.now() - latest_time > fps_max){
      capture64();
      latest_time = Date.now();
    }
    return image64;
  };
  /*--- Set image size ---*/
  this.setSize = function (w, h) {
    width = w;
    height = h;
    return this;
  };
};
var camera = new Camera(0, 50).setSize(320, 240);
// var camera = new Camera(0, 50).setSize(640, 480);


/*--- Send client files ---*/
app.get('/*', function(req, res){
    var filepath = __dirname + '/client' + url.parse(req.url).pathname;
    fs.exists(filepath, function(exists) {
        if (exists) {
          console.log('Accept: ' + filepath);
          res.sendFile(filepath);
        } else {
          console.log('Reject: ' + filepath);
          res.end();
        }
    });
});
/*--- Server start listening ---*/
http.listen(3000, function(){
		console.log('listening on *:3000');
});

/*--- Connection ---*/
io.on('connection', function(socket){

    //Send frame image
    socket.on('frame request', function(msg){
        io.to(socket.id).emit('frame', {
            image: camera.getImage64()
        });
    });
});
