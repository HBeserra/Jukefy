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



app.get('/login-qr', function (req, res) {
	let code;
	console.log(req.method)
	do {
		code = numberCode(6)
	} while (codeVerify(code));

	login[login.length] = {
		print: code,
		time: Date.now()
	}
	res.send(code)
	QR.QRClearService()
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


/*
function like(id) {

	$.ajax({
		url: 'https://api.spotify.com/v1/me/tracks/contains?ids=' + id,
		headers: {
			'Authorization': 'Bearer ' + access_token
		},
		success: function (response) {

			if (response[0] == true) {
				
			} else {
				try { document.querySelector("#like").classList.remove("fas") } catch (error) { }
				document.querySelector("#like").classList.add("far")
			}
		}
	})

}*/




app.get('/qrservice', function (req, res) {
	console.log("/qrservice")
	QRClearService();
	res.send("ok")
})




app.get('/JukeBox', function (req, res) {
	res.redirect('/jukebox');
})

app.listen(PORT, () => {
	console.log(`Our app is running on port ${PORT}`);
});


