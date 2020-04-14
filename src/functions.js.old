
var login = [];
var lastLoginClear = 0;

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

function numberCode(x) {
    let code = "";
    for (let g = 0; g < x; g++) {
        code += Math.floor(Math.random() * 10);
    }
    return code
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

exports.codeVerify = codeVerify;
exports.numberCode = numberCode;
exports.QRClearService = QRClearService;