// Declare Constant Variables
const dom = {
    c: document.getElementById("canvas"),
    iconc: document.getElementById("iconcanvas"),
    turnsremainingtext: document.getElementById("turnsremainingtext"),
    turnsremainingval: document.getElementById("turnsremainingval"),
    nameplatecontainer: document.getElementById("nameplatecontainer"),
    ingamelargecontainer: document.getElementById("ingamecontainer"),
    roomslargecontainer: document.getElementById("roomselectcontainer"),
    createroomlargecontainer: document.getElementById("createroomcontainer"),
    inroomlargecontainer: document.getElementById("inroomcontainer"),
}

const ctx = dom.c.getContext("2d")
const ictx = dom.iconc.getContext("2d")
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
    dom.iconc.width = 65;
    dom.iconc.height = 600;
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
    
    socket.on("conquest", (player, tile, success, turn, subaction, maxsubactions, statecount, currentmaxsubactions) => {
        if(success){
            for(let i = 0; i < maxsubactions.length; i++){
                dom["" + i + "info"].innerText = "AP: " + maxsubactions[i] + "    States: " + statecount[i];
            }
            game.stateowners[tile] = player;
            if(game.gamestate == "claim"){
                game.playersfinishedclaiming[player] = true;
                if(player == game.player && game.gamestate == "claim"){
                    dom.turnsremainingtext.innerText = "Waiting for other players..."
                }
            }
        }
        if(game.gamestate == "conquest"){
            dom.turnsremainingval.innerText = currentmaxsubactions - subaction;
            dom.turnsremainingtext.innerText = "Player " + turn + " Actions remaining:"
            game.turn = turn;
            console.log(game.turn);
        }
    });

    socket.on("gamestate", (gamestate) => {
        game.gamestate = gamestate;
    })

    socket.on("players", (players) =>{
        game.players = players;
        if(players.length > dom.nameplatecontainer.childElementCount){
            while(players.length > dom.nameplatecontainer.childElementCount){
                let nameplatediv = document.createElement("div");
                nameplatediv.classList.add("nameplate")
                let name = document.createElement("p");
                name.innerText = players[dom.nameplatecontainer.childElementCount][0];
                nameplatediv.appendChild(name);
                let info = document.createElement("p");
                info.innerText = "AP: 1    States: 0";
                nameplatediv.appendChild(info);
                dom.nameplatecontainer.append(nameplatediv);
                dom["" + players[dom.nameplatecontainer.childElementCount - 1][0] + "info"] = info;
            }
        }
    })
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
        this.highlightedstate = null;
        this.player = 0;
        this.playersfinishedclaiming = [];
        this.stateowners = [];
        this.turn = 0;
        this.players = []; // Playernum, subturnlimit, color
        this.gameInterval = setInterval(()=>{
            let temp = performance.now();
            game.Update();
            game.Draw();
            //console.log(Math.round((performance.now() - temp)*10)/10)
        }, 16)
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
                    else if(this.gamestate == "conquest"){
                        if(mouseclick){
                            socket.emit("attack", i);
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
                    this.sctx.fillStyle = this.players[this.stateowners[i]][2];
                    this.sctx.fillRect(0, this.metadata[i][5] - 1, this.spritesheet.width, this.metadata[i][2]);
                }
                ctx.drawImage(this.spritesheet, 0, this.metadata[i][5] - 1, this.metadata[i][1], this.metadata[i][2], this.metadata[i][3], this.metadata[i][4], this.metadata[i][1], this.metadata[i][2]);
            }
        }
        ictx.lineWidth = 10;
        for(let i = 0; i < this.players.length; i++){
            ictx.beginPath();
            ictx.arc(32.5, 57.5+70*i, 22.5, 0, 2*Math.PI)
            ictx.strokeStyle = "#000";
            if(this.gamestate == "claim"){
                if(!this.playersfinishedclaiming[i]){
                    ictx.strokeStyle = "#FFF";
                }
            }
            if(this.gamestate == "conquest"){
                if(this.turn == i){
                    ictx.strokeStyle = "#FFF";
                }
            }
            ictx.fillStyle = this.players[i][2];
            ictx.stroke();
            ictx.fill();
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

function CreateRoom(){
    dom.roomslargecontainer.style.display = "none";
    dom.createroomlargecontainer.style.display = "flex";
}

function CreateRoomSubmit(){
    dom.createroomlargecontainer.style.display = "none";
    dom.inroomlargecontainer.style.display = "flex";
}

function ReturnToRoomSelect(){
    dom.createroomlargecontainer.style.display = "none";
    dom.inroomlargecontainer.style.display = "none";
    dom.roomslargecontainer.style.display = "flex";
}

function StartGame(){
    dom.inroomlargecontainer.style.display = "none";
    dom.ingamelargecontainer.style.display = "flex";
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