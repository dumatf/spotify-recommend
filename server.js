var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
  var emitter = new events.EventEmitter();
  unirest.get('https://api.spotify.com/v1/' + endpoint)
         .qs(args)
         //Request.end sends the request
         .end(function(response) {
           var artist = response.body.artists.items[0];
           unirest.get('https://api.spotify.com/v1/artists/' + 
                       artist.id + 
                       '/related-artists')
                  .end(function(res) {
                    artist.related = res.body.artists;
                    emitter.emit('end', artist);
                  })
         });
  return emitter;
};

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
  var searchReq = getFromApi('search', {
    q: req.params.name,
    limit: 1,
    type: 'artist'
  });
  
  searchReq.on('end', function(item) {
    res.json(item);
  });
  
  searchReq.on('error', function() {
    res.sendStatus(404);
  });
});

app.listen(8080);