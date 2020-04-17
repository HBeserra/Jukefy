const express = require('express');
const request = require('request');
const routes = express.Router();
const app = express()

// const Login = require("./login_controller/qr")

// routes.get("/qr", Login.Code)
// routes.get("/login", Login.Login)

const Spotify = require("./spotify controller/spotify")

routes.get('/login', Spotify.login)
routes.get('/callback', Spotify.callback)
routes.get('/refresh_token', Spotify.refresh_token)
routes.get('/currently-playing', Spotify.currently_playing)

const QR = require("./qr_controller/qr")

routes.get('/qrservice',  QR.qrService)
routes.get('/clearcode',  QR.clearcode)
routes.get('/verifycode', QR.verifyCode)
routes.get('/qrcode',     QR.qrcode)
routes.get('/login-qr',   QR.loginQr)                        


routes.get('/JukeBox', (req, res) => {res.redirect('/jukebox');})

module.exports = routes