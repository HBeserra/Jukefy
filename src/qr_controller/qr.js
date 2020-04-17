const querystring = require('querystring');

var a = require("../login")
var login = a.login
function QRClearService() {
    let timer = Date.now();
    if (timer - lastLoginClear > 5 * 60000) {
        lastLoginClear = timer
        console.log("Limpeza de codigos de login iniciada")
        let removed = 0;
        let x = login.length
        for (let c = 0; c < login.length; c++) {
            if (Date.now() - login[c].time > 5 * 60 * 1000) {
                login.splice(c, 1)
                removed++
            } 
        }
        console.log("Limpeza de cod. terminada: " + ((Date.now() - timer) / 1000) + "s =>" + removed + " removidos | cod. validos =>" + (((x - removed) / x) * 100) + "%")
        console.log("Cod. no começo => " + x + " Codigos Atualmente => " + login.length)
    }
}

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


module.exports = {
    qrService(req, res) {
        console.log("/qrservice")
        QRClearService();
        res.send("ok")
    },
    clearcode(req, res) {
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
    },
    verifyCode(req, res) {
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

    },
    qrcode(req, res) {
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
    },
    loginQr(req, res) {
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
        QRClearService()
    }
}
