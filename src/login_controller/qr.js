const querystring = require('querystring');
const stateKey = 'spotify_auth_state';
require('dotenv/config');
const func = require('../functions')

const client_id = process.env.CLIENT_ID // Your client id
const client_secret = process.env.CLIENT_SECRET // Your secret
const redirect_uri = process.env.sendREDIRECT_URI

var login = [];
var lastLoginClear = 0;



var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};


module.exports = {
    Code(req, res) {
        console.log(req.method)
        switch (req.method) {
            case "GET":
                let code;
                do {
                    code = func.numberCode(6)
                } while (func.codeVerify(code));

                login[login.length] = {
                    print: code,
                    time: Date.now()
                }
                res.send(code)
                func.QRClearService()


                break;
            case "POST":
                res.send("POST")
                break
            default:
                res.send("Erro")
                break;
        }
    },
    Login(req, res) {
        var state = generateRandomString(16);

        if (req.query.qrcode) {
            console.log("QRCode: " + req.query.qrcode)
        }
        let stateMensage = {
            state: state,
            qrcode: req.query.qrcode
        }

        stateMensage = JSON.stringify(stateMensage)

        res.cookie(stateKey, stateMensage); // set the String in cookie 

        // your application requests authorization
        var scope = 'streaming  user-read-private user-read-email user-read-playback-state user-library-read user-modify-playback-state';
        return res.redirect('https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                state: stateMensage
            }));


    }
}

