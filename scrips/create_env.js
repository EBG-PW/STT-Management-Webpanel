const fs = require("fs");
const readline = require('readline');

const Vorlage = fs.readFileSync('../.env.example').toString();
fs.writeFile("../.env", Vorlage, (err) => {if (err) console.log(err);
    
});

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
    var ans = await askQuestion("Pleace chance .env\n\nAfter you are done type ok and hit enter: ");
}

Questions()