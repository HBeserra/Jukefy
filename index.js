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

var login = [];

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

  if (req.query.qrcode) {
    console.log("QRCode: " + req.query.qrcode)
  }
  let cookieMensage = {
    state: state,
    qrcode: req.query.qrcode
  }

  cookieMensage = JSON.stringify(cookieMensage)

  res.cookie(stateKey, cookieMensage);





  // your application requests authorization
  var scope = 'streaming  user-read-private user-read-email user-read-playback-state user-library-read user-modify-playback-state';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: cookieMensage
    }));
});

app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  console.log("state  :" + state)
  console.log("Cookie :" + storedState)

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
          //console.log(body);
        });


        let Qr = JSON.parse(state)
        console.log(Qr.qrcode)
        if (Qr.qrcode != null) {

          for (let c = 0; c < login.length; c++) {
            if (login[c].print == Qr.qrcode) {
              console.log(login[c])
              let key = login[c]
              //login[c] = ""
              login[c].access_token = access_token
              login[c].refresh_token = refresh_token
              console.log(login[c])
              break
            }

          }

          res.redirect("https://testlabr.com/")

        } else {
          // we can also pass the token to the browser to make requests from there
          res.redirect('/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token
            }));
        }



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


app.get('/login-qr', function (req, res) {
  let code;

  do {
    code = numberCode(6)
  } while (codeVerify(code));

  login[login.length] = {
    print: code,
    time: Date.now()
  }
  console.log(code)
  console.log(login)
  res.send(code)

})

function codeVerify(x) {
  console.log(login)
  if ((!login) && (login.length >= 1)) {
    for (let a = 0; a < login.length; a++) {
      if ((login[a].code) || (x == login[a].code)) {
        return true;
      }
    }
  }
  return false

}

function numberCode(x) {
  let code = "";
  for (let g = 0; g < x; g++) {
    code += Math.floor(Math.random() * 10);
  }
  return code
}
app.get('/qrcode', function (req, res) {
  let i
  console.log(req.query.code)
  for (let c = 0; c < login.length; c++) {
    if (login[c].print == req.query.code) {
      console.log(login[c])

      if ((login[c].access_token != null) && (login[c].refresh_token != null)) {
        res.send('/#' +
          querystring.stringify({
            access_token: login[c].access_token,
            refresh_token: login[c].refresh_token
          }));
        login.splice(c, 1);
        i = true
      } else {
        res.send("200")
        i = true
      }
      break
    }

  }
  if (!i) { res.send("404") }
})

app.get('/clearcode', function (req, res) {

  console.log("removing =>" + req.query.code)
  if (req.query.code) {
    for (let c = 0; c < login.length; c++) {
      if (login[c].print == req.query.code) {
        login.splice(c, 1);
        res.send("ok")
      } else {
        res.send("200")
      }
      break
    }
  } else {
    res.send("404")
  }
  res.send("NO CODE")
})
//verifycode
app.get('/verifycode', function (req, res) {

  console.log(req.query.code)
  if (req.query.code) {
    for (let c = 0; c < login.length; c++) {
      if ((login[c].print == req.query.code) && (login[c].refresh_token !== undefined) && (login[c].access_token !== undefined)) {

        res.send({
          refresh_token: login[c].refresh_token,
          access_token: login[c].access_token
        })
      } else {
        res.send("200")
      }
      break
    }
  } else {
    res.send("404")
  }
  res.send("NO CODE")
})


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
      console.log(body)
      if ((body != null) && (body.item != null)) {

        if ((body.item.id) && (req.headers.music_id != body.item.id)) {
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
            'body': "ok",
            currently_playing_type: body.currently_playing_type
          })
        }
      } else {
        res.send({
          'is_playing': body.is_playing,
          'progress_ms': body.progress_ms,
          'body': "ok",
          currently_playing_type: body.currently_playing_type
        })
      }
    } else {
      res.end()
    }
  });
});

//JukeBox/


app.get('/jukebox', function (req, res) {
  res.redirect('/JukeBox');
})

app.listen(PORT, () => {
  console.log(`Our app is running on port ${PORT}`);
});


