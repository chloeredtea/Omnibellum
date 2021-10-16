// Declare Constant Variables
const dom = {
    c: document.getElementById("canvas"),
    iconc: document.getElementById("iconcanvas"),
    turnsremainingtext: document.getElementById("turnsremainingtext"),
    turnsremainingval: document.getElementById("turnsremainingval"),
    nameplatecontainer: document.getElementById("nameplatecontainer"),
    roomplatecontainer: document.getElementById("roomplatecontainer"),
    ingamelargecontainer: document.getElementById("ingamecontainer"),
    roomslargecontainer: document.getElementById("roomselectcontainer"),
    createroomlargecontainer: document.getElementById("createroomcontainer"),
    inroomlargecontainer: document.getElementById("inroomcontainer"),
    roomnameinput: document.getElementById("createroomname"),
    passwordinput: document.getElementById("createroompassword"),
    maxplayerval: document.getElementById("createroommaxplayers"),
    mapselectval: document.getElementById("createroommap"),
    endscreenlargecontainer: document.getElementById("endscreencontainer"),
    winnerdisplay: document.getElementById("winner"),
}

const colors = [
    "#e6194B",
    "#3cb44b",
    "#ffe119",
    "#42d4f4",
    "#f58231",
    "#911eb4",
    "#f032e6",
    "#9A6324",
    "#000075"
]

const ctx = dom.c.getContext("2d")
const ictx = dom.iconc.getContext("2d")
let socket;
let game;
let mousex = 0, mousey = 0, mouseclick = false;

// Global Functions
function Init(){
    socket = io();
    InitSocketFunctions();
    game = new Game();
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
    socket.on("mapdata", (spritesheet, metadata) => {
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
    
    socket.on("turn", (turn) =>{
        if(game.gamestate == "conquest"){
            dom.turnsremainingval.innerText = "?";
            dom.turnsremainingtext.innerText = "Player " + turn + " Actions remaining:"
            game.turn = turn;
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
        }
    });

    socket.on("gamestate", (gamestate) => {
        game.gamestate = gamestate;
        if(gamestate == "claim"){
            dom.inroomlargecontainer.style.display = "none";
            dom.ingamelargecontainer.style.display = "flex";
        }
        game.UpdatePlayers();
    })

    socket.on("winner", (winner) =>{
        game.winner = winner;
        game.highlightedstate = null;
        dom.winnerdisplay.innerHTML = winner + " wins!";
        dom.endscreenlargecontainer.style.display = "flex";
    })

    socket.on("players", (players) =>{
        if(game.gamestate != "endscreen"){
            game.players = players;
        }
        game.UpdatePlayers();
    })

    socket.on("roomlist", (data)=>{ // Name, Players, Max Players, Map, Roomid
        while(dom.roomplatecontainer.firstChild){
            dom.roomplatecontainer.removeChild(dom.roomplatecontainer.firstChild);
        }
        for(let i = 0; i < data.length; i++){
            let roomplate = document.createElement("button");
            roomplate.classList.add("roomplate")
            let currentel = document.createElement("p");
            currentel.innerHTML = data[i][0];
            roomplate.appendChild(currentel);
            currentel = document.createElement("div");
            let currentel2 = document.createElement("p");
            currentel2.innerHTML = data[i][3];
            currentel.appendChild(currentel2);
            currentel2 = document.createElement("p");
            let currentel3 = document.createElement("img");
            currentel3.src = "assets/tinyicon.png";
            currentel2.appendChild(currentel3);
            currentel2.innerText = "" + data[i][1] + "/" + data[i][2];
            currentel.appendChild(currentel2);
            roomplate.appendChild(currentel);
            currentel = document.createElement("img");
            currentel.src = "assets/" + data[i][3] + ".png";
            roomplate.appendChild(currentel);
            roomplate.onclick = () =>{
                game.JoinRoom(data[i][4])
            }
            dom.roomplatecontainer.appendChild(roomplate);
        }
    })
}

// Classes

class Game {
    constructor(){
        this.mapname;
        this.spritesheet = document.createElement("canvas");
        this.sctx = this.spritesheet.getContext("2d");
        this.metadata;
        this.oldmousex = 0;
        this.oldmousey = 0;
        this.gamestate = "roomselect";
        this.highlightedstate = null;
        this.player = 0;
        this.winner = null;
        this.playersfinishedclaiming = [];
        this.stateowners = [];
        this.turn = 0;
        this.tick = 0;
        this.players = []; // Playernum, subturnlimit, color
        this.gameInterval = setInterval(()=>{
            let temp = performance.now();
            game.Update();
            game.Draw();
            //console.log(Math.round((performance.now() - temp)*10)/10)
        }, 16)

        this.RefreshRooms();

    }

    Update(){
        if(this.gamestate == "claim" || this.gamestate == "conquest"){
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
        else if(this.gamestate == "roomselect"){
            this.tick++;
            if(this.tick > 60){
                this.tick = 0;
                this.RefreshRooms();
            }
        }
    }

    Draw(){
        if(this.gamestate == "claim" || this.gamestate == "conquest" || this.gamestate == "endscreen"){
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
                        this.sctx.fillStyle = colors[this.players[this.stateowners[i]][2]];
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
                ictx.fillStyle = colors[this.players[i][2]];
                ictx.stroke();
                ictx.fill();
            }
        }

    }
    RefreshRooms(){
        socket.emit("refreshrooms");
    }

    JoinRoom(id){
        socket.emit("joinroom", id);
        dom.roomslargecontainer.style.display = "none";
        dom.inroomlargecontainer.style.display = "flex";
        this.gamestate = "roomlobby";
    }

    UpdatePlayers(){
        if(this.gamestate == "claim"){
            if(this.players.length > dom.nameplatecontainer.childElementCount){
                while(this.players.length > dom.nameplatecontainer.childElementCount){
                    let nameplatediv = document.createElement("div");
                    nameplatediv.classList.add("nameplate")
                    let name = document.createElement("p");
                    name.innerText = this.players[dom.nameplatecontainer.childElementCount][0];
                    nameplatediv.appendChild(name);
                    let info = document.createElement("p");
                    info.innerText = "AP: 1    States: 0";
                    nameplatediv.appendChild(info);
                    dom.nameplatecontainer.append(nameplatediv);
                    dom["" + this.players[dom.nameplatecontainer.childElementCount - 1][0] + "info"] = info;
                }
            }
        }
        else if(this.gamestate == "roomlobby"){
            for(let i = 0; i < 8; i++){
                document.getElementById("colorbutton" + (i+1)).style.visibility = "visible";
                document.getElementById("inroomname" + (i+1)).innerHTML = "";
                document.getElementById("inroomcolor" + (i+1)).style.backgroundColor = "transparent";
            }
            document.getElementById("colorbutton9").style.visibility = "visible";
            for(let i = 0; i < this.players.length; i++){
                document.getElementById("inroomname" + (i+1)).innerHTML = this.players[i][0];
                document.getElementById("inroomcolor" + (i+1)).style.backgroundColor = colors[this.players[i][2]];
                document.getElementById("colorbutton" + (this.players[i][2]+1)).style.visibility = "hidden";
            }
        }
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
    socket.emit("createroom", dom.roomnameinput.value, dom.passwordinput.value, dom.maxplayerval.value, dom.mapselectval.value)
    game.gamestate = "roomlobby";
}

function ReturnToRoomSelect(){
    game.gamestate = "roomselect";
    Leave();
    dom.createroomlargecontainer.style.display = "none";
    dom.inroomlargecontainer.style.display = "none";
    dom.roomslargecontainer.style.display = "flex";
}

function StartGame(){
    socket.emit("start")
    dom.inroomlargecontainer.style.display = "none";
    dom.ingamelargecontainer.style.display = "flex";
}

function Leave(){
    game.gamestate = "roomselect";
    socket.emit("leave");
}

function LeaveFinishedGame(){
    game.gamestate = "roomselect";
    Leave();
    dom.ingamelargecontainer.style.display = "none";
    dom.endscreenlargecontainer.style.display = "none";
    dom.roomslargecontainer.style.display = "flex";
    clearInterval(game.gameInterval);
    game = new Game();
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

function ChangeColor(val){
    socket.emit("changecolor", val)
}