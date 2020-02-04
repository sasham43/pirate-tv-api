var express = require('express');
var bodyParser = require('body-parser');
var Omx = require('node-omxplayer');
const youtubedl = require('youtube-dl')
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('/home/pi/pirate_tv', sqlite3.OPEN_READWRITE, function(err, resp){
    console.log('db opened', err, resp)
});

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
var current_channel = null

// start by playing channel
playChannel(channel_list[0])

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
    var video = ''
    console.log('video:', req.params.video, req.params.video.includes('youtube.com'))
    if(req.params.video.includes('youtube.com')){
        video = req.params.video
    } else {
        video = `https://www.youtube.com/watch?v=${req.params.video}`
    }
    youtubedl.exec(video, ['-g', '-f best'], {}, function(err, info){
        console.log('got it', err, info)
        player.newSource(info[0], null, true) // start new source with loop
        res.send(player.running)
    })
})

app.get('/current-channel', function(req, res, next){
    return res.send({
        current_channel
    })
})

app.post('/select-channel/:id', async function(req, res, next){
    getChannelById(db, req.params.id).then(async channel=>{
        try {
            var running = await playChannel(channel)
            current_channel = channel.id
        } catch(e){
            res.status(500).send(e)
        }

        res.send({current_channel})
    })
})

app.post('/new-channel', function(req, res, next){
    var new_channel = req.body

    db.run('INSERT INTO channels VALUES ($1, $2, $3, $4, $5)', [
        new_channel.id,
        new_channel.name,
        new_channel.link ? new_channel.link : null,
        new_channel.file ? new_channel.file : null,
        new_channel.type
    ], function(err, resp){
        console.log('insert', err, resp)
        res.send(resp)
    })
})

app.get('/channel/:id', function(req, res, next){
    getChannelById(db, req.params.id).then(channel=>{
        res.send(channel)
    }).catch(err=>{
        res.status(500).send(err)
    })
})

app.get('/channels', function(req, res, next){
    getAllChannels(db).then(rows=>{
        res.send(rows)
    }).catch(err=>{
        res.status(500).send(err)
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

function getAllChannels(db){
    return new Promise((resolve, reject)=>{
        db.all('select * from channels;', function(err, rows){
            if(err){
                console.log('error', err)
                // res.status(500).send(err)
                reject(err)
            } else {
                console.log('rows', rows)
                // res.send(rows)
                resolve(rows)
            }
        })
    })
}

function getChannelById(db, id){
    return new Promise((resolve, reject)=>{
        db.get('SELECT * FROM channels WHERE id = $1;', [id], (err, row)=>{
            if(err) reject(err)

            resolve(row)
        })
    })
}

function playChannel(channel){
    return new Promise((resolve, reject)=>{
        if(channel.link){
            var video = `https://www.youtube.com/watch?v=${channel.link}`
            youtubedl.exec(video, ['-g', '-f best'], {}, function(err, info){
                if(err) console.log('youtube-dl err', err)
                player.newSource(info[0], null, true) // start new source with loop
                console.log('player info:', player.info())
                // res.send(player.running)
                resolve(player.running)
            })
        } else if (channel.file) {
            player.newSource(channel.file, null, true)
            console.log('player info:', player.info())
            resolve(player.running)
        } else {
            reject('No file or link in channel')
        }
    })
}
