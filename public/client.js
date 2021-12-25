// Declare Constant Variables
const dom = {
    welcomelargecontainer: document.getElementById("welcomecontainer"),
    username: document.getElementById("username"),
    header: document.getElementById("header"),
    c: document.getElementById("canvas"),
    iconc: document.getElementById("iconcanvas"),
    nameplatecontainer: document.getElementById("nameplatecontainer"),
    roomplatecontainer: document.getElementById("roomplatecontainer"),
    ingamelargecontainer: document.getElementById("ingamecontainer"),
    roomslargecontainer: document.getElementById("roomlistcontainer"),
    createroomlargecontainer: document.getElementById("createroomcontainer"),
    inroomlargecontainer: document.getElementById("inroomcontainer"),
    roomnameinput: document.getElementById("createroomname"),
    passwordinput: document.getElementById("createroompassword"),
    mapselectval: document.getElementById("createroommap"),
    endscreenlargecontainer: document.getElementById("endscreencontainer"),
    winnerdisplay: document.getElementById("winner"),
    turnsremaining: document.getElementById("turnsremaining"),
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

const modifiercolors = [
    "#57360a",
    "#8a8a8a",
    "#15ff00",
    "#6e0000"
]

const mapnamedictionary = {
    "unitedstates": "United States",
    "europe": "Europe",
    "world": "World",
    "fournations": "Four Nations",
}

const ideologydict = [
    "nationalist",
    "conservative",
    "liberal",
    "communist",
    "anarchist"
];

const ctx = dom.c.getContext("2d")
const ictx = dom.iconc.getContext("2d")
let socket;
let game;
let mousex = 0, mousey = 0, mouseclick = false;
let username;
let gamelist = [], maxplayerselection = 8;

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
    dom.iconc.height = 940;

    document.getElementById("nationalistbutton").onmouseenter = () => {
        document.getElementById("inlobby0").style.display = "block";
    }
    document.getElementById("conservativebutton").onmouseenter = () => {
        document.getElementById("inlobby1").style.display = "block";
    }
    document.getElementById("liberalbutton").onmouseenter = () => {
        document.getElementById("inlobby2").style.display = "block";
    }
    document.getElementById("communistbutton").onmouseenter = () => {
        document.getElementById("inlobby3").style.display = "block";
    }
    document.getElementById("anarchistbutton").onmouseenter = () => {
        document.getElementById("inlobby4").style.display = "block";
    }

    document.getElementById("nationalistbutton").onmouseleave = () => {
        document.getElementById("inlobby0").style.display = "none";
    }
    document.getElementById("conservativebutton").onmouseleave = () => {
        document.getElementById("inlobby1").style.display = "none";
    }
    document.getElementById("liberalbutton").onmouseleave = () => {
        document.getElementById("inlobby2").style.display = "none";
    }
    document.getElementById("communistbutton").onmouseleave = () => {
        document.getElementById("inlobby3").style.display = "none";
    }
    document.getElementById("anarchistbutton").onmouseleave = () => {
        document.getElementById("inlobby4").style.display = "none";
    }
}

function InitSocketFunctions(){
    socket.on("playernum", (playernum) => {
        game.player = playernum;
        if(playernum == 0){
            document.getElementById("startbutton").style.display = "flex";
        }
        else{
            document.getElementById("startbutton").style.display = "none";
        }
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
                game.improvements.push([]);
                game.fincountdowns.push(0);
            }
            game.sctx.globalCompositeOperation = "source-atop";
            game.Draw(); 
        }
    })
    
    socket.on("turn", (turn) =>{
        if(game.gamestate == "conquest"){

            game.turn = turn;
        }
    })
    // tile is -1 if just updating subactions
    socket.on("conquest", (player, tile, success, turn, subaction, maxsubactions, statecount, currentmaxsubactions, fincountdowns) => {
        if(success){
            for(let i = 0; i < maxsubactions.length; i++){
                dom["" + i + "info"].innerText = maxsubactions[i];
            }
            game.stateowners[tile] = player;
            if(game.gamestate == "claim"){
                game.playersfinishedclaiming[player] = true;
            }
        }
        else if(tile != -1){
            game.attackfailedanimation = .3;
            game.attackedtile = tile;
            game.oldtime = performance.now() / 1000;
        }
        if(game.gamestate == "conquest"){
            game.turn = turn;
            dom.turnsremaining.innerText = (currentmaxsubactions - subaction) + " Actions Remaining";
        }
        if(tile == -1){
            dom.turnsremaining.innerText = (currentmaxsubactions - subaction) + " Actions Remaining";
        }
        game.fincountdowns = fincountdowns;
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
        if(winner == -1){
            dom.winnerdisplay.innerHTML = "nobody wins. how could you let this happen? it's really not that hard to just claim the remaining tiles... but the would-be winner left. you don't even get to play again now. try it. the button won't work. you'll be in a broken lobby. hope you're happy.";

        }
        else{
            game.winner = winner;
            game.highlightedstate = null;
            if(winner == game.player){
                dom.winnerdisplay.innerHTML = "VICTORY!!!!";
                dom.winnerdisplay.style.color = "#FFF";
            }
            else{
                dom.winnerdisplay.innerHTML = game.players[winner][5].toUpperCase() + " WINS!";
                dom.winnerdisplay.style.color = colors[game.players[winner][0]];
            }
        }

        
        dom.endscreenlargecontainer.style.display = "flex";
    })

    socket.on("players", (players) =>{
        if(game.gamestate == "roomselect"){
            game.gamestate = "roomlobby";
        }
        if(game.gamestate != "endscreen"){
            game.players = players.slice(0, -1);
            game.maxplayers = players[players.length - 1]
        }
        game.UpdatePlayers();
    })
    socket.on("roomlist", (data)=>{ // Name, Players, Max Players, Map, Roomid, Password
        gamelist = data;
        while(dom.roomplatecontainer.firstChild){
            dom.roomplatecontainer.removeChild(dom.roomplatecontainer.firstChild);
        }
        for(let i = 0; i < data.length; i++){
            let roomplate = document.createElement("button");
            let row1plate = document.createElement("div");
            let row2plate = document.createElement("div");
            let roomnameplate = document.createElement("p");
            let roomimageplate = document.createElement("img");
            let roomnumplate = document.createElement("p");
            let mapnameplate = document.createElement("p");
            let roomnamecontainer = document.createElement("div");

            roomnamecontainer.id = "roomnamecontainer";

            roomplate.classList.add("roomplate")
            if(data[i][5]){
                let lockimage = document.createElement("img");
                lockimage.id = "lockimage";
                lockimage.src = "assets/locked.png";
                roomnamecontainer.appendChild(lockimage)
            }
            roomnameplate.innerText = data[i][0];
            roomnamecontainer.appendChild(roomnameplate);
            let length = data[i][0].length;
            if(length > 38){
                length = 38;
            }
            if(length < 15){
                length = 15;
            }
            roomnameplate.style.fontSize = ((15 / length) * 2.5) + "vmin";
            roomimageplate.src = "assets/" + data[i][3] + ".png";
            roomnumplate.innerHTML = "" + data[i][1] + "/" + data[i][2];
            mapnameplate.innerHTML = mapnamedictionary[data[i][3]];
            row1plate.setAttribute("id", "row1plate");
            row2plate.setAttribute("id", "row2plate");

            row1plate.appendChild(roomnamecontainer);
            row1plate.appendChild(roomimageplate);
            row2plate.appendChild(roomnumplate);
            row2plate.appendChild(mapnameplate);
            roomplate.appendChild(row1plate);
            roomplate.appendChild(row2plate);

            roomplate.id = i;

            roomplate.onclick = () =>{
                if(data[i][5]){
                    document.getElementById("passwordprompt").style.display = "flex";
                    game.roomattempt = i;
                }
                else{
                    game.JoinRoom(data[i][4]);
                }
                
            }
            dom.roomplatecontainer.appendChild(roomplate);
        }
    })

    socket.on("build", (buildcount) =>{
        game.gamestate = "build";
        game.buildcount = buildcount;
        dom.turnsremaining.innerText = "Build " + buildcount + " Improvements";
    })

    socket.on("improvements", (improvements)=>{
        game.improvements = improvements;
    })

    socket.on("passwordsuccess", (success) =>{
        if(success){
            dom.roomslargecontainer.style.display = "none";
            dom.inroomlargecontainer.style.display = "flex";
            document.getElementById("enterpasswordprompt").style.borderColor = "#000";
            document.getElementById("enterpasswordtext").innerText = "ENTER PASSWORD"
            this.gamestate = "roomlobby";
        }
        else{
            document.getElementById("enterpasswordprompt").style.borderColor = "#F00";
            document.getElementById("enterpasswordtext").innerText = "WRONG PASSWORD. TRY AGAIN"
        }
    })

    socket.on("kicked", (success) =>{
        if(success){
            ReturnToRoomSelect();
        }
    })

    socket.on("id", (id) => {
        game.id = id;
    });

    socket.on("building", (player) =>{
        dom.turnsremaining.innerText = game.players[player][5] + " is building.";
    });

    socket.on("map", (map)=>{
        ChangeMapImage(map);
    });
}

// Classes

class Game {
    constructor(){
        this.mapname;
        this.spritesheet = document.createElement("canvas");
        this.sctx = this.spritesheet.getContext("2d");
        this.metadata;
        this.fincountdowns = [];
        this.oldmousex = 0;
        this.oldmousey = 0;
        this.buildtype = 0;
        this.attackfailedanimation = 0;
        this.attackedtile = -1;
        this.oldtime;
        this.gamestate = "welcome";
        this.highlightedstate = null;
        this.maxplayers = 8;
        this.player = 0;
        this.roomattempt = 0;
        this.ideology = Math.floor((Math.random() * 5));
        this.winner = null;
        this.buildcount = 0;
        this.playersfinishedclaiming = [];
        this.improvements = [];
        this.stateowners = [];
        this.turn = 0;
        this.tick = 0;
        this.players = []; // Playernum, subturnlimit, color
        this.gameInterval = setInterval(()=>{
            //let temp = performance.now();
            game.Update();
            game.Draw();
            //console.log(Math.round((performance.now() - temp)*10)/10)
        }, 16)
        dom.turnsremaining.innerText = "Claim your starting tile!";
        dom.nameplatecontainer.innerHTML = "";
        this.RefreshRooms();
    }

    Update(){
        if(this.gamestate == "claim" || this.gamestate == "conquest" || this.gamestate == "build"){
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
                        else if(this.gamestate == "build"){
                            if(mouseclick){
                                if(!this.improvements[i].includes(this.buildtype)){
                                    socket.emit("build", i, this.buildtype);
                                    game.buildcount--;
                                    if(game.buildcount > 0){
                                        dom.turnsremaining.innerText = "Build " + game.buildcount + " Improvements";
                                    }
                                    
                                }
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
        if(this.gamestate == "claim" || this.gamestate == "conquest" || this.gamestate == "endscreen" || this.gamestate == "build"){
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
            if(this.attackfailedanimation > 0){
                this.attackfailedanimation -= performance.now() / 1000 - this.oldtime;
                
                this.oldtime = performance.now() / 1000
                if(Math.round(this.oldtime*15) % 2 == 1){
                    this.sctx.fillStyle = "#F00";
                }
                else{
                    this.sctx.fillStyle = "#FFF";
                }
                this.sctx.fillRect(0, this.metadata[this.attackedtile][5] - 1, this.spritesheet.width, this.metadata[this.attackedtile][2]);
                ctx.drawImage(this.spritesheet, 0, this.metadata[this.attackedtile][5] - 1, this.metadata[this.attackedtile][1], this.metadata[this.attackedtile][2], this.metadata[this.attackedtile][3] - 1, this.metadata[this.attackedtile][4], this.metadata[this.attackedtile][1], this.metadata[this.attackedtile][2]);
                ctx.drawImage(this.spritesheet, 0, this.metadata[this.attackedtile][5] - 1, this.metadata[this.attackedtile][1], this.metadata[this.attackedtile][2], this.metadata[this.attackedtile][3] + 1, this.metadata[this.attackedtile][4], this.metadata[this.attackedtile][1], this.metadata[this.attackedtile][2]);
                ctx.drawImage(this.spritesheet, 0, this.metadata[this.attackedtile][5] - 1, this.metadata[this.attackedtile][1], this.metadata[this.attackedtile][2], this.metadata[this.attackedtile][3], this.metadata[this.attackedtile][4] - 1, this.metadata[this.attackedtile][1], this.metadata[this.attackedtile][2]);
                ctx.drawImage(this.spritesheet, 0, this.metadata[this.attackedtile][5] - 1, this.metadata[this.attackedtile][1], this.metadata[this.attackedtile][2], this.metadata[this.attackedtile][3], this.metadata[this.attackedtile][4] + 1, this.metadata[this.attackedtile][1], this.metadata[this.attackedtile][2]);
                this.sctx.fillStyle = "#999"
                this.sctx.fillRect(0, this.metadata[this.attackedtile][5] - 1, this.spritesheet.width, this.metadata[this.attackedtile][2]);
                if(this.attackfailedanimation < 0){
                    this.attackedtile = -1;
                }
            }
            if(this.metadata != undefined){
                for(let i = 0; i < this.metadata.length; i++){
                    if(this.stateowners[i] != -1){
                        this.sctx.fillStyle = colors[this.players[this.stateowners[i]][2]];
                        this.sctx.fillRect(0, this.metadata[i][5] - 1, this.spritesheet.width, this.metadata[i][2]);
                    }
                    if(this.attackedtile != i){
                        ctx.drawImage(this.spritesheet, 0, this.metadata[i][5] - 1, this.metadata[i][1], this.metadata[i][2], this.metadata[i][3], this.metadata[i][4], this.metadata[i][1], this.metadata[i][2]);
                    }
                }
                for(let i = 0; i < this.metadata.length; i++){
                    for(let j = 0; j < this.improvements[i].length; j++){
                        if(this.improvements[i][j] == 3){
                            ctx.drawImage(document.getElementById("researchimage"), this.metadata[i][10] - this.improvements[i].length*10 + j*20 - 5, this.metadata[i][11] - 10)
                        }
                        else if(this.improvements[i][j] == 2){
                            let moneynum = 7 - this.fincountdowns[i];
                            if(this.fincountdowns[i] < 1 || moneynum < 1){
                                moneynum = 1;
                            }
                            ctx.drawImage(document.getElementById("moneyimage" + moneynum), this.metadata[i][10] - this.improvements[i].length*10 + j*20 - 5, this.metadata[i][11] - 10)
                        }
                        else if(this.improvements[i][j] == 1){
                            ctx.drawImage(document.getElementById("industryimage"), this.metadata[i][10] - this.improvements[i].length*10 + j*20 - 5, this.metadata[i][11] - 10)
                        }
                        else if(this.improvements[i][j] == 0){
                            ctx.drawImage(document.getElementById("defenseimage"), this.metadata[i][10] - this.improvements[i].length*10 + j*20 - 5, this.metadata[i][11] - 10)
                        }
                    }
                }
            }
            ictx.clearRect(0, 0, 1000, 1000);
            ictx.lineWidth = 10;
            for(let i = 0; i < this.players.length; i++){
                ictx.beginPath();
                if(window.innerWidth > 1200){
                    ictx.arc(32.5, 57.5+80*i, 22.5, 0, 2*Math.PI)
                }
                else{
                    ictx.arc(32.5, 57.5+105*i, 22.5, 0, 2*Math.PI)
                }
                ictx.strokeStyle = "#000";
                if((!this.stateowners.includes(i) || dom["" + i + "info"].innerText == 0) && this.gamestate == "conquest"){
                    ictx.strokeStyle = "#999";
                    dom["" + i + "info"].innerText = 0;
                    dom["" + i + "info"].style.color = "#999";
                }
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

    JoinRoom(id, password = ""){
        socket.emit("joinroom", id, username, password, false);
    }

    UpdatePlayers(){
        if(this.gamestate == "claim"){
            if(this.players.length > dom.nameplatecontainer.childElementCount){
                while(this.players.length > dom.nameplatecontainer.childElementCount){
                    let nameplatediv = document.createElement("div");
                    nameplatediv.classList.add("nameplate")
                    let name = document.createElement("p");
                    name.innerText = this.players[dom.nameplatecontainer.childElementCount][5];
                    name.classList.add("realname")
                    nameplatediv.appendChild(name);
                    let infodiv = document.createElement("div");
                    infodiv.classList.add("flex-row");
                    infodiv.classList.add("infodiv");
                    let ideologyimage = document.createElement("img");
                    ideologyimage.classList.add("ideologyimage");
                    let info = document.createElement("p");
                    infodiv.appendChild(ideologyimage);
                    infodiv.appendChild(info);
                    nameplatediv.appendChild(infodiv);
                    dom.nameplatecontainer.append(nameplatediv);
                    dom["" + this.players[dom.nameplatecontainer.childElementCount - 1][0] + "info"] = info;
                    ideologyimage.src = "assets/ideologyicons/" + ideologydict[this.players[dom.nameplatecontainer.childElementCount - 1][4]] + ".png";
                    ideologyimage.id = this.players[dom.nameplatecontainer.childElementCount - 1][4];
                    ideologyimage.onmouseover = function (e){
                        document.getElementById("ingame" + e.toElement.id).style.display = "block";
                    }
                    ideologyimage.onmouseout = function(e){
                        for(let i = 0; i < 5; i++){
                            document.getElementById("ingame" + i).style.display = "none";
                        }
                    }
                }
            }
        }
        else if(this.gamestate == "roomlobby"){
            for(let i = 0; i < 8; i++){
                document.getElementById("colorbutton" + (i+1)).style.visibility = "visible";
                document.getElementById("inroomname" + (i+1)).innerHTML = "";
                document.getElementById("inroomcolor" + (i+1)).style.backgroundColor = "transparent";
                document.getElementById("namebox" + (i+1)).style.backgroundColor = "#FFF"
                document.getElementById("namebox" + (i+1)).style.visibility = "visible";
                document.getElementById("ideologyicon" + (i+1)).style.visibility = "visible";
                if(i > 0){
                    document.getElementById("kickimg" + i).style.visibility = "hidden";
                    document.getElementById("kick" + i).style.visibility = "hidden";
                }
            }
            document.getElementById("colorbutton9").style.visibility = "visible";
            for(let i = 0; i < this.players.length; i++){
                document.getElementById("inroomname" + (i+1)).innerHTML = this.players[i][5];
                document.getElementById("inroomcolor" + (i+1)).style.backgroundColor = colors[this.players[i][2]];
                document.getElementById("colorbutton" + (this.players[i][2]+1)).style.visibility = "hidden";
                document.getElementById("ideologyiconimage" + (i+1)).src = "assets/ideologyicons/" + ideologydict[this.players[i][4]] + ".png";
                if(i > 0 && this.player == 0){
                    document.getElementById("kickimg" + i).style.visibility = "visible";
                    document.getElementById("kick" + i).style.visibility = "visible";
                }
            }
            for(let i = this.players.length; i < 8; i++){
                document.getElementById("namebox" + (i+1)).style.backgroundColor = "#888"
                document.getElementById("ideologyicon" + (i+1)).style.visibility = "hidden";
                if(this.maxplayers < i + 1){
                    document.getElementById("namebox" + (i+1)).style.visibility = "hidden";
                }
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

function QuickPlay(){
    for(let i = 0; i < gamelist.length; i++){
        if(!gamelist[i][5] && gamelist[i][1] < gamelist[i][2]){
            game.JoinRoom(gamelist[i][4]);
        }
    }
}

function SetMaxPlayers(n){
    document.getElementById("maxplayerbutton" + maxplayerselection).style.backgroundColor = "#FFF"
    maxplayerselection = n;
    document.getElementById("maxplayerbutton" + n).style.backgroundColor = "#90cc5e"
}

function CreateRoomSubmit(){
    dom.createroomlargecontainer.style.display = "none";
    dom.inroomlargecontainer.style.display = "flex";
    socket.emit("createroom", dom.roomnameinput.value, dom.passwordinput.value, maxplayerselection, dom.mapselectval.value, username)
    game.gamestate = "roomlobby";
}

function ReturnToRoomSelect(){
    game.gamestate = "roomselect";
    document.getElementById("passwordprompt").style.display = "none";
    Leave();
    dom.createroomlargecontainer.style.display = "none";
    dom.inroomlargecontainer.style.display = "none";
    dom.roomslargecontainer.style.display = "flex";
}

function ChangeIdeology(n){
    game.ideology = n;
    socket.emit("changeideology", n);
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
    Leave();
    dom.ingamelargecontainer.style.display = "none";
    dom.endscreenlargecontainer.style.display = "none";
    dom.roomslargecontainer.style.display = "flex";
    clearInterval(game.gameInterval);
    game = new Game();
    game.gamestate = "roomselect";
}

function PlayButton(){
    game.gamestate = "roomselect";
    dom.welcomelargecontainer.style.display = "none";
    dom.roomslargecontainer.style.display = "flex";
    dom.header.style.display = "inline";
    
    document.getElementById("passwordprompt").style.display = "none";
    dom.username.value = dom.username.value.replace(/\W/g, '')
    if(dom.username.value == ""){
        username = "Anonymous"
    }
    else{
        username = dom.username.value;
        if(username.length > 15){
            username = username.substring(0, 15);
        }
    }
    if(dom.username.value.toLowerCase() == "partisa"){
        document.body.style.backgroundImage = "url('assets/partisa.png')";
        document.body.style.backgroundPosition = "center 0px";
        console.log("partisa");
    }
    if(!document.location.hash == ""){
        socket.emit("joinroom", document.location.hash, username, "", true);
    }
}

// determine if point is inside polygon
function pointinside(vertx, verty, testx, testy) {
    let up = false, down = false, left = false, right = false;
    for(let i = 0; i < vertx.length; i++){
        if(vertx[i] == testx && verty[i] < testy){
            up = true;
        }
        if(vertx[i] == testx && verty[i] > testy){
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

function SetBuildType(type){
    game.buildtype = type;
}

function ChangeMapSelectImage(select){
    let image = document.getElementById("mapselectimage");
    image.src="/assets/" + select.options[select.selectedIndex].value + ".png";
    image = document.getElementById("mapimage");
    image.src="/assets/" + select.options[select.selectedIndex].value + ".png";
}

function ChangeMapImage(map){
    image = document.getElementById("mapimage");
    image.src="/assets/" + map + ".png";
}

function SubmitPassword(){
    game.JoinRoom(gamelist[game.roomattempt][4], document.getElementById("enterpasswordprompt").value);
}

function Kick(num){
    socket.emit("kick", num);
}

function CopyLink(){
    navigator.clipboard.writeText("https://www.omnibellum.io#" + game.id).then(()=>{
        document.getElementById("copylinktext").innerHTML = "LINK COPIED!";
        setTimeout(()=>{
            document.getElementById("copylinktext").innerHTML = "COPY LINK";
        }, 3500);
    })
}

function PlayAgain(){
    dom.ingamelargecontainer.style.display = "none";
    dom.endscreenlargecontainer.style.display = "none";
    dom.inroomlargecontainer.style.display = "flex";
    clearInterval(game.gameInterval);
    game = new Game();
    game.gamestate = "roomlobby";
    socket.emit("playagain");
}