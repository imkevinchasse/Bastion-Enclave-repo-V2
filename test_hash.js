
const crypto = require('crypto');

async function sha1(str) {
    return crypto.createHash('sha1').update(str).digest('hex').toUpperCase();
}

(async () => {
    console.log(await sha1("Conglomerate#12"));
})();
