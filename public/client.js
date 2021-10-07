// Declare Constant Variables
const dom = {
    c: document.getElementById("canvas"),
    turnsremainingtext: document.getElementById("turnsremainingtext"),
    turnsremainingval: document.getElementById("turnsremainingval")
}
const ctx = dom.c.getContext("2d")
let socket;
let game;
let mousex = 0, mousey = 0, mouseclick = false;

// Global Functions
function Init(){
    socket = io();
    InitSocketFunctions();
    game = new Game("unitedstates");
    dom.c.width = 800;
    dom.c.height = 600;
    dom.c.onmousemove = (e) =>{
        mousex = e.offsetX;
        mousey = e.offsetY;
    }
    dom.c.onmousedown = (e) =>{
        mouseclick = true;
    }
}

function InitSocketFunctions(){
    socket.on("playernum", (playernum) => {
        game.player = playernum;
    })
    socket.on("mapresponse", (spritesheet, metadata) => {
        game.spritesheet.width = metadata[0] + 0;
        game.spritesheet.height = metadata[1] + 0;
        let timg = new Image();
        timg.src = "data:image/png;base64," + spritesheet;
        timg.onload = () => {
            game.sctx.drawImage(timg, 0, 0);
            metadata.shift();
            metadata.shift();
            game.metadata = metadata;
            for(let i = 0; i < metadata.length; i++){
                game.stateowners.push(-1);
            }
            game.sctx.globalCompositeOperation = "source-atop";
            game.Draw(); 
        }
    })
    
    socket.on("conquest", (player, tile, success) => {
        if(success){
            game.stateowners[tile] = player;
        }
    });
}

// Classes

class Game {
    constructor(mapname){
        this.mapname = mapname;
        this.RequestMap();
        this.spritesheet = document.createElement("canvas");
        this.sctx = this.spritesheet.getContext("2d");
        this.metadata;
        this.oldmousex = 0;
        this.oldmousey = 0;
        this.gamestate = "claim";
        this.turn = 0;
        this.subturn = 0;
        this.turnlimit = 3;
        this.highlightedstate = null;
        this.player = 0;
        this.stateowners = [];
        this.players = [
            ["Chloe", "#F00"],
            ["Kate", "#0F0"],
            ["Felix", "#00F"]
        ];
        this.gameInterval = setInterval(()=>{
            let temp = performance.now();
            game.Update();
            game.Draw();
            //console.log(Math.round((performance.now() - temp)*10)/10)
        }, 16)
    }

    GameUpdate(){
        this.subturn++;
        if(this.subturn == this.turnlimit){
            this.subturn = 0;
            this.turn++;
            if(this.turn == this.players.length){
                this.turn = 0;
            }
        }
        dom.turnsremainingval.innerText = this.turnlimit - this.subturn;
        dom.turnsremainingtext.innerText = "Player " + this.turn + " Actions remaining: "
    }

    IsAdjacent(index){
        console.log(this.metadata)
        let adjacent = false;
        for(let i = 0; i < this.metadata[index][8].length; i++){
            if(this.stateowners[this.metadata[index][8][i]] == this.player && this.stateowners[index] != this.player){
                adjacent = true;
                break;
            }
        }
        return adjacent;
    }

    Update(){
        if(this.oldmousex != mousex || this.oldmousey != mousey || mouseclick){
            this.oldmousex = mousex;
            this.oldmousey = mousey;
            this.highlightedstate = null;
            for(let i = 0; i < this.metadata.length; i++){
                if(pointinside(this.metadata[i][6], this.metadata[i][7], mousex, mousey)){
                    this.highlightedstate = i;
                    if(this.gamestate == "claim"){
                        if(mouseclick){
                            socket.emit("attack", i);
                        }
                    }
                    else if(this.gamestate == "conquer"){
                        if(mouseclick && this.turn == this.player && this.IsAdjacent(i)){
                            socket.emit("attack", i);
                            this.GameUpdate();
                        }
                    }
                    break;
                }
            }
            mouseclick = false;
        }
    }

    Draw(){
        ctx.clearRect(0, 0, dom.c.width, dom.c.height);
        if(this.highlightedstate != null){
            this.sctx.fillStyle = "#FFF";
            this.sctx.fillRect(0, this.metadata[this.highlightedstate][5] - 1, this.spritesheet.width, this.metadata[this.highlightedstate][2]);
            ctx.drawImage(this.spritesheet, 0, this.metadata[this.highlightedstate][5] - 1, this.metadata[this.highlightedstate][1], this.metadata[this.highlightedstate][2], this.metadata[this.highlightedstate][3] - 1, this.metadata[this.highlightedstate][4], this.metadata[this.highlightedstate][1], this.metadata[this.highlightedstate][2]);
            ctx.drawImage(this.spritesheet, 0, this.metadata[this.highlightedstate][5] - 1, this.metadata[this.highlightedstate][1], this.metadata[this.highlightedstate][2], this.metadata[this.highlightedstate][3] + 1, this.metadata[this.highlightedstate][4], this.metadata[this.highlightedstate][1], this.metadata[this.highlightedstate][2]);
            ctx.drawImage(this.spritesheet, 0, this.metadata[this.highlightedstate][5] - 1, this.metadata[this.highlightedstate][1], this.metadata[this.highlightedstate][2], this.metadata[this.highlightedstate][3], this.metadata[this.highlightedstate][4] - 1, this.metadata[this.highlightedstate][1], this.metadata[this.highlightedstate][2]);
            ctx.drawImage(this.spritesheet, 0, this.metadata[this.highlightedstate][5] - 1, this.metadata[this.highlightedstate][1], this.metadata[this.highlightedstate][2], this.metadata[this.highlightedstate][3], this.metadata[this.highlightedstate][4] + 1, this.metadata[this.highlightedstate][1], this.metadata[this.highlightedstate][2]);
            this.sctx.fillStyle = "#999"
            this.sctx.fillRect(0, this.metadata[this.highlightedstate][5] - 1, this.spritesheet.width, this.metadata[this.highlightedstate][2]);

        }
        if(this.metadata != undefined){
            for(let i = 0; i < this.metadata.length; i++){
                if(this.stateowners[i] != -1){
                    this.sctx.fillStyle = this.players[this.stateowners[i]][1];
                    this.sctx.fillRect(0, this.metadata[i][5] - 1, this.spritesheet.width, this.metadata[i][2]);
                }
                ctx.drawImage(this.spritesheet, 0, this.metadata[i][5] - 1, this.metadata[i][1], this.metadata[i][2], this.metadata[i][3], this.metadata[i][4], this.metadata[i][1], this.metadata[i][2]);
            }
        }
    }

    RequestMap(){
        socket.emit("maprequest", this.mapname);
    }
}

// Load
document.body.onload = () => {
    Init();
}


// determine if point is inside polygon
function pointinside(vertx, verty, testx, testy) {
    let up = false, down = false, left = false, right = false;
    for(let i = 0; i < vertx.length; i++){
        if(vertx[i] == testx && verty[i] < testy){
            up = true;
        }
        if(vertx[i] == testx && verty[i] < testy){
            down = true;
        }
        if(verty[i] == testy && vertx[i] < testx){
            left = true;
        }
        if(verty[i] == testy && vertx[i] > testx){
            right = true;
        }
    }
    return up && down && left & right;
}