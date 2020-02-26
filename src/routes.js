const express = require('express');
const request = require('request');
const routes = express.Router();
const app = express()

const Login = require("./login_controller/qr")

routes.get("/qr", Login.Code)
routes.get("/login", Login.Login)

module.exports = routes