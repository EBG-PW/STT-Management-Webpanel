require('dotenv').config();
const fs = require("fs");

function CreateHTML(htmlname){
    const Vorlage = fs.readFileSync(`./template/${htmlname}.html`).toString();
    
    //Insert IP and PORT
    var FertigHTML = Vorlage.split("REPLACE_THIS_WITH_BACKEND_IP").join(process.env.IP)
    FertigHTML = FertigHTML.split("REPLACE_THIS_WITH_BACKEND_PORT").join(process.env.PORT)
    FertigHTML = FertigHTML.split("REPLACE_THIS_WITH_BACKEND_PROTOKOL").join(process.env.HTTP)

    console.log(`${htmlname} was build:\nIP: ${process.env.IP}\nPort: ${process.env.PORT}`)

    fs.writeFile(`./src/web/${htmlname}.html`, FertigHTML, (err) => {if (err) console.log(err);

	});
}

CreateHTML("index")
CreateHTML("Teams")
CreateHTML("TrustFactor")