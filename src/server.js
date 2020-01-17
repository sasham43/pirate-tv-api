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

var channel_list = [{
    id: 0,
    name: 'Cyberpunk Synthwave',
    file: '/home/pi/tv/synth1.mp4'
}]

app.use('/quit', function(req, res, next){
    player.quit()
    res.send('quit')
})

app.use('/pause', function(req, res, next){
    player.pause()
    res.send(player.running)
})

app.use('/resume', function(req, res, next){
    player.play()
    res.send(player.running)
})

app.use('/play/:video', function(req, res, next){
    var video = `https://www.youtube.com/watch?v=${req.params.video}`
    youtubedl.exec(video, ['-g', '-f best'], {}, function(err, info){
        console.log('got it', err, info)
        player.newSource(info[0], null, true) // start new source with loop
        res.send(player.running)
    })
})

app.post('/select-channel/:id', async function(req, res, next){
    var channel = channel_list.find(c=>c.id == req.params.id)

    var running = await playChannel(channel)

    res.send(`Playing ${req.params.id}; Running: ${running}`)
})

app.post('/new-channel', function(req, res, next){
    var new_channel = req.body
    new_channel.id = channel_list.length

    channel_list.push(new_channel)
    res.send('new channel')
})

app.get('/channels', function(req, res, next){
    res.send(channel_list)
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


function playChannel(channel){
    return new Promise((resolve, reject)=>{
        if(channel.link){
            var video = `https://www.youtube.com/watch?v=${channel.link}`
            youtubedl.exec(video, ['-g', '-f best'], {}, function(err, info){
                player.newSource(info[0], null, true) // start new source with loop
                console.log('player info:', player.info())
                // res.send(player.running)
                resolve(player.running)
            })
        } else if (channel.path) {
            player.newSource(channel.path)
            console.log('player info:', player.info())
            resolve(player.running)
        }
    })
}
