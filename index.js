/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework

var cors = require('cors');

var cookieParser = require('cookie-parser');
require('dotenv/config');



var QR = require('./qr.js')


login = QR.passport

const PORT = process.env.PORT || 3000;



var app = express();

app.use(express.static(__dirname + '/public'))
	.use(cors())
	.use(cookieParser());

//app.use("/api", require("./src/routes"))
app.use("/", require("./src/routes"))

app.listen(PORT, () => {
	console.log(`Our app is running on port ${PORT}`);
});


