var unirest = require('unirest');
var express = require('express');
var events = require('events');

var app = express();
app.use(express.static('public'));

function doArtistSearch(endpoint, args) {
  var emitter = new events.EventEmitter();

  // spotify artist search
  unirest.get('https://api.spotify.com/v1/' + endpoint)
    .qs(args)
    .end(function(response) {
      var artist = response.body.artists.items[0];

      // spotify related artists search
      unirest.get('https://api.spotify.com/v1/artists/' + artist.id + '/related-artists')
        .end(function(res) {
          artist.related = res.body.artists;

          var completed = 0;
          var emitEnd = function() {
            if (completed === artist.related.length) {
              emitter.emit('end', artist);
            }
          };

          // spotify top tracks search
          artist.related.forEach(function(relatedArtist) {
            console.log("relatedArtist.id: ", relatedArtist.id);
            unirest.get('https://api.spotify.com/v1/artists/' + relatedArtist.id + '/top-tracks')
              .qs({
                country: 'US'
              })
              .end(function(res) {
                relatedArtist.tracks = res.body.tracks;
                completed += 1;
                emitEnd();
              });
          });
        });
    });

  return emitter;
}

app.get('/search/:name', function(req, res) {
  searchReq = doArtistSearch('search', {
    q: req.params.name,
    limit: 1,
    type: 'artist'
  });

  searchReq.on('end', function(item) {
    res.json(item);
  });

  searchReq.on('error', function(err) {
    res.status(404).json(err);
  });
});

app.listen(8080);