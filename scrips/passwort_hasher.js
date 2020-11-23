require('dotenv').config();
const fs = require("fs");
const readline = require('readline');
const bcrypt = require('bcrypt');

const saltRounds = parseInt(process.env.saltRounds);

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
    var ans = await askQuestion("Type your password: ");
    bcrypt.hash(ans, saltRounds, function(err, hash) {
        console.log(hash)
    });
}

Questions()