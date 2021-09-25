// Declare Constant Variables
const dom = {
    c: document.getElementById("canvas")
}
const ctx = dom.c.getContext("2d")

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