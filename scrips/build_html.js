require('dotenv').config();
const fs = require("fs");

function CreateHTML(){
    const Vorlage = fs.readFileSync('../template/index.html').toString();
    
    //Insert IP and PORT
    var FertigHTML = Vorlage.split("REPLACE_THIS_WITH_BACKEND_IP").join(process.env.IP)
    FertigHTML = FertigHTML.split("REPLACE_THIS_WITH_BACKEND_PORT").join(process.env.PORT)
    //Insert Ping Parameter
    FertigHTML = FertigHTML.split("REPLACE_THIS_WITH_PINGINFO_GREEN").join(process.env.PingGreen)
    FertigHTML = FertigHTML.split("REPLACE_THIS_WITH_PINGINFO_YELLOW").join(process.env.PingYellow)
    FertigHTML = FertigHTML.split("REPLACE_THIS_WITH_PINGINFO_ORANGE").join(process.env.PingOrange)

    console.log(`HTML was build:\nIP: ${process.env.IP}\nPort: ${process.env.PORT}\nPingTimes:\nGrün: Von 0 bis ${process.env.PingGreen}\nGelb: Von ${process.env.PingGreen} bis ${process.env.PingYellow}\nGelb: Von ${process.env.PingYellow} bis ${process.env.PingOrange}\nRot: Über ${process.env.PingOrange}`)

    fs.writeFile("../src/Web/index.html", FertigHTML, (err) => {if (err) console.log(err);

	});
}

CreateHTML()