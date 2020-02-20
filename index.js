/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var Vibrant = require('node-vibrant')

var client_id = 'ff4571e3e25c43328413ba16b7c724ab'; // Your client id
var client_secret = '65ce233804604f759eea72d31cddf03d'; // Your secret
const PORT = process.env.PORT || 3000;

if (process.env.PORT != null) {
  var redirect_uri = "https://jukebr.herokuapp.com/callback"; // Your redirect uri
} else {
  var redirect_uri = "http://localhost:3000/callback"; // Your redirect uri
}


console.log("redirect_uri:" + redirect_uri)
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login', function (req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-library-read user-modify-playback-state';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


app.get('/currently-playing', function (req, res) {

  //console.log(req.headers)
  //console.log(req.headers.music_id)
  //console.log("access_token:" + req.headers.access_token)
  var currently_playing = {
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: { 'Authorization': 'Bearer ' + req.headers.access_token },
    json: true
  }

  request.get(currently_playing, function (error, response, body) {
    //console.log(body);



    if (!error && response.statusCode === 200) {
      if (body != null) {
        if (req.headers.music_id != body.item.id) {
          console.log(body.item.name)
          var color;

          Vibrant.from(body.item.album.images[0].url).getSwatches((err, swatches) => {

            let ourColours = [];

            for (let key in swatches) {

              if (swatches.hasOwnProperty(key) && (swatches[key]) != null) {

                ourColours.push({
                  color: (swatches[key]).getHex(),
                  text: (swatches[key]).getTitleTextColor()
                });

              }
            }

            let randomItem = ourColours[Math.floor(Math.random() * ourColours.length)];

            //console.log(randomItem.color);
            //console.log(randomItem.text);

            res.send({
              'is_playing': body.is_playing,
              'progress_ms': body.progress_ms,
              'body': body,
              'color': [randomItem.color, randomItem.text]
            })


          });



        } else {
          res.send({
            'is_playing': body.is_playing,
            'progress_ms': body.progress_ms,
            'body': "ok"
          })
        }
      }
    } else {
      res.end()
    }
  });

  // requesting access token from refresh token
  /*var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });*/
});


app.listen(PORT, () => {
  console.log(`Our app is running on port ${PORT}`);
});


