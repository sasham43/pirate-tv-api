var express = require('express');
var bodyParser = require('body-parser');
var Omx = require('node-omxplayer');
const youtubedl = require('youtube-dl')

var app = express();

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));
app.use(bodyParser.json({
  limit: '50mb'
}));

var listenPort = process.env.PORT || 3005;

var player = Omx();

app.use('/quit', function(req, res, next){
    player.quit()
    res.send('quit')
})

app.use('/stop', function(req, res, next){
    player.stop()
    res.send(player.running)
})

app.use('/play/:video', function(req, res, next){
    var video = `https://www.youtube.com/watch?v=${req.params.video}`
    youtubedl.exec(video, ['-g', '-f best'], {}, function(err, info){
        console.log('got it', err, info)
        player.newSource(info[0])
        res.send(player.running)
    })
})

app.use('/', function(req, res, next){
    res.send('10-4 good buddy')
})

app.use(function(err, req, res, next){
  console.log('error:', err);
  res.status(err.statusCode || 500).json(err);
});

app.get('*', function (req, res) {
    res.sendFile(__dirname + '/root/public/index.html');
});

app.listen(listenPort, function(){
  console.log('server listening on port', listenPort + '...');
});
