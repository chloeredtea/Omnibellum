// Declare Constant Variables
const dom = {
    c: document.getElementById("canvas")
}
const ctx = dom.c.getContext("2d")
const socket = io();
let img;

socket.on("message", (value) =>{
    console.log(value);
    img = new Image();
    img.src = "data:image/png;base64," + value;
});

// Global Functions
function Init(){
    let game = new Game();
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