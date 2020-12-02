require('dotenv').config();
const fs = require("fs");
const pg = require('pg');
const readline = require('readline');
const bcrypt = require('bcrypt');

const saltRounds = parseInt(process.env.saltRounds);

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

async function Questions() {
    var username = await askQuestion("Type your username: ");
    var discordID = await askQuestion("Type your discordID: ");
    var rights = await askQuestion(`\n\nWelche Rechte soll ${username} haben:\n0 - Keine\n1 - Read Only\n2 - Read + User Only\n3 - Trust R/W\n4 - Trust & Team R/W\n5 - Admin\n\n`);
    var password = await askQuestion("\n\nType your password: ");
    bcrypt.hash(password, saltRounds, function(err, hash) {
        console.log(hash)
        pool.query('INSERT INTO web_members(discord_id, loginname, passwordhash, rights) VALUES ($1,$2,$3,$4)', [discordID, username, hash, Gruppen[rights.trim()]], (err, result) => {
            if (err) {
                console.log(err)
            }
            console.log(`${username} wurde registriert!\n`, result)
          });
    });
}

Questions()