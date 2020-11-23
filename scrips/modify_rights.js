require('dotenv').config();
const pg = require('pg');
const readline = require('readline');

console.log(process.env.DBUser)
    
const pool = new pg.Pool({
    user: process.env.DBUser,
    host: process.env.DBHost,
    database: process.env.DB,
    password: process.env.DBPw,
    port: process.env.DBPort,
  })

//Gruppen:
const Gruppen = []
Gruppen.push([]) //Keine
Gruppen.push(["TrustRead","TeamRead"]) //Read Only
Gruppen.push(["TrustRead","TeamRead","ReadUser"]) //Read + User Only
Gruppen.push(["TrustRead","TrustWrite"]) //Trust R/W
Gruppen.push(["TrustRead","TrustWrite","TeamRead","TeamWrite"]) //Trust & Team R/W
Gruppen.push(["TrustRead","TrustWrite","TeamRead","TeamWrite","WriteUser","ReadUser"]) //Admin

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

async function main() {
    var user = await askQuestion("Nutzer den du editieren möchtest?: ");
    var rights = await askQuestion(`Welche Rechte soll ${user} haben:\n0 - Keine\n1 - Read Only\n2 - Read + User Only\n3 - Trust R/W\n4 - Trust & Team R/W\n5 - Admin\n\n`);

    pool.query('UPDATE web_members SET rights = $1 WHERE loginname = $2', [Gruppen[rights.trim()], user], (err, result) => {
        if (err) {
            console.log(err)
        }
        console.log(result)
      });
}

main()