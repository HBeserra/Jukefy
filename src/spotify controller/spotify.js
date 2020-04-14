require('dotenv/config');
const functions = require('../functions')
var request = require('request');
const querystring = require('querystring');
var Vibrant = require('node-vibrant')

var client_id = process.env.CLIENT_ID // Your client id
var client_secret = process.env.CLIENT_SECRET // Your secret

var stateKey = 'spotify_auth_state';

var redirect_uri = (process.env.PORT != null) ? "http://juke.testlabr.com/callback" : "http://localhost:3000/callback"
console.log("redirect_uri:" + redirect_uri)
module.exports = {
    login(req, res) {
        var state = functions.generateRandomString(16);

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
    },
    callback(req, res) {

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
    },
    refresh_token(req, res) {
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
    },
    currently_playing(req, res) {

        //console.log(req.headers)
        //console.log(req.headers.music_id)
        //console.log("access_token:" + req.headers.access_token)
        var currently_playing = {
            url: 'https://api.spotify.com/v1/me/player/currently-playing?market=BR&additional_types=episode',
            headers: { 'Authorization': 'Bearer ' + req.headers.access_token },
            json: true
        }

        request.get(currently_playing, function (error, response, body) {

            if (error || (response.statusCode !== 200)) {
                if (response.statusCode === 204) {
                    // sessão privada ativa
                    res.send({
                        'is_playing': false
                    })
                    return null
                }
                console.log("[ERRO] err o " + error + " status " + response.statusCode)
                res.status(400).send('Bad Request')
                return null
            }

            if ((body === null) || (body.is_playing === null) || (body.currently_playing_type === null)) {
                console.log("[NO CONTENT]" + (body === null) + (body.is_playing === null) + (body.currently_playing_type === null))
                res.send({
                    'is_playing': false
                })
                return null
            }


            let resposta = {}

            resposta.is_playing = body.is_playing
            resposta.progress_ms = body.progress_ms
            resposta.currently_playing_type = body.currently_playing_type

            if (body.item === null) { resposta.currently_playing_type = "no"; res.send(resposta); return null } //se item for null

            resposta.duration_ms = body.item.duration_ms

            if (req.headers.music_id === body.item.id) { res.send(resposta); return null }

            resposta.id = body.item.id

            console.log(body.item.name)
            resposta.item = {}
            resposta.item.name = body.item.name
            resposta.item.images = []
            
            
            let images = (body.currently_playing_type == "episode")? body.item.images : body.item.album.images

            for (let i = 0; i < images.length; i++) {
                resposta.item.images.push(images[i].url)
            }
            resposta.item.artists = ""

            if (body.currently_playing_type == "episode") {
                resposta.item.artists = body.item.show.name
            }else{
                for (let i = 0; i < body.item.album.artists.length; i++) {
                    resposta.item.artists += body.item.album.artists[i].name;
                    if ((body.item.album.artists.length > 0) && ((i + 1) < body.item.album.artists.length)) { resposta.item.autists += ", "; }
                }    
            }
            

            try {
                Vibrant.from(resposta.item.images[resposta.item.images.length - 1]).getSwatches((err, swatches) => {
                    let ourColours = [];
                    for (let key in swatches) {

                        if (swatches.hasOwnProperty(key) && (swatches[key]) != null) {
                            ourColours.push({
                                color: (swatches[key]).getHex(),
                                text: (swatches[key]).getTitleTextColor()
                            });
                        }
                    }
                    let x = (ourColours[Math.floor(Math.random() * ourColours.length)])
                    resposta.item.color = [x.color, x.text]
                    try {
                        var currently_playing = {
                            url: 'https://api.spotify.com/v1/me/tracks/contains?ids=' + body.item.id,
                            headers: {
                                'Authorization': 'Bearer ' + req.headers.access_token
                            },
                            json: true
                        }
                        request.get(currently_playing, function (error, response, bo) {
                            resposta.item.like = bo[0]
                            res.send(resposta)
                        })
                    } catch (error) {
                        console.log(error)
                        res.send(resposta)
                    }

                })
            } catch (error) {
                resposta.item.color = ["#191414", "#FFFFFF"]
                console.log(error)
                res.send(resposta)
            }
        });
    }
}