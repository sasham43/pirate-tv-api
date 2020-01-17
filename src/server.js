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

app.use('/play/:video', function(req, res, next){
    var video = `https://www.youtube.com/watch?v=${req.params.video}`
    youtubedl.exec(video, ['-g', '-f best'], {}, function(err, info){
        console.log('got it', err, info)
        player.newSource(info[0])
        res.send('got it')
    })
    // const video = youtubedl('https://www.youtube.com/watch?v=TvZskcqdYcE', ['-g'])
    //
    // video.on('end', function(info){
    //     console.log('video completed', info)
    //     res.send(info)
    // })
    //
    // video.on('error', function(err){
    //     console.log('error', err)
    //     res.send(err)
    // })

    // player.newSource('$(youtube-dl -g https://www.youtube.com/watch?v=TvZskcqdYcE)')
    // res.send('playing')
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
