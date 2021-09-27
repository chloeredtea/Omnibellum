// Declare Constant Variables
const dom = {
    c: document.getElementById("canvas")
}
const ctx = dom.c.getContext("2d")
let socket;
let img;

// Global Functions
function Init(){
    socket = io();
    InitSocketFunctions();
    let game = new Game();
    dom.c.width = 800;
    dom.c.height = 600;
    ctx.fillRect(0, 0, 800, 600);
}

function InitSocketFunctions(){
    // Recieving Images
    /*socket.on("message", (value) =>{
        console.log(value);
        img = new Image();
        img.src = "data:image/png;base64," + value;
    });*/
}


// Classes

class Game {
    constructor(){
        
    }

    Update(){

    }

    Draw(){

    }
}

// Load
document.body.onload = () => {
    Init();
}