canvas = document.getElementById('image_canvas');
canvas.width = 640;
canvas.height = 480;
ctx = canvas.getContext('2d');

var socket = io();
/* Receive frame */
socket.on('frame', function(frame){
    if (!frame.image) return;
    var src = 'data:image/jpeg;base64,' + frame.image;
    var img = new Image();
    img.src = src;
    img.onload = function () {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      //Request next frame
      socket.emit('frame request');
    };
});

/* Request first frame */
socket.emit('frame request');
