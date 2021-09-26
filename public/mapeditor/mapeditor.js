// Loading uploaded image into memory
window.addEventListener('load', function() {
    document.querySelector('input[type="file"]').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            var img = document.querySelector('img');
            img.onload = () => {
                URL.revokeObjectURL(img.src);
            }
            img.src = URL.createObjectURL(this.files[0]);
        }
    });
  });

// Putting image onto canvas

let imgData, c1, c2, c3, c4;
let vertexdata = {};
let statepixels = {};

function GenerateBorders(){
    c1 = document.getElementById("canvas1");
    let ctx = c1.getContext("2d")
    let img = document.getElementById("myImg")
    c1.width = img.width
    c1.height = img.height
    ctx.drawImage(img, 0, 0)

// Finding the borders of the states and putting them into two dictionaries.
    imgRawData = ctx.getImageData(0, 0, c1.width, c1.height);
    imgData = imgRawData.data;
    for(let i = 0; i < imgData.length; i+=4){
        let initialcolor = "" + imgData[i]+imgData[i+1]+imgData[i+2];
        if(imgData[i] != 0 || imgData[i+1] != 0 || imgData[i+2] != 0){
            // Check Right
            if(i < imgData.length - 4 && (imgData[i] != imgData[i+4] || imgData[i+1] != imgData[i+5] || imgData[i+2] != imgData[i+6])){
                if(imgData[i+4] != 0 || imgData[i+5] != 0 || imgData[i+6] != 0){
                    if("" + imgData[i]+imgData[i+1]+imgData[i+2] != "255255255"){
                        if(vertexdata.hasOwnProperty(initialcolor)){
                            vertexdata[initialcolor][0].push(i/4 - c1.width*Math.floor((i/4)/c1.width));
                            vertexdata[initialcolor][1].push(Math.floor((i/4)/c1.width));
                        }
                        else{
                            vertexdata[initialcolor] = [[], []];
                            vertexdata[initialcolor][0].push(i/4 - c1.width*Math.floor((i/4)/c1.width));
                            vertexdata[initialcolor][1].push(Math.floor((i/4)/c1.width));
                        }
                    }
                    imgData[i] = 0;
                    imgData[i+1] = 0;
                    imgData[i+2] = 0;
                    imgData[i+3] = 255;
                }
            }
            // Check Up
            if(i > c1.width*4 && (imgData[i-c1.width*4] == 0 && imgData[i-c1.width*4+1] == 0 && imgData[i-c1.width*4+2] == 0)){
                if(initialcolor != "255255255"){
                    if(vertexdata.hasOwnProperty(initialcolor)){
                        vertexdata[initialcolor][0].push((i-c1.width*4)/4 - c1.width*Math.floor(((i-c1.width*4)/4)/c1.width));
                        vertexdata[initialcolor][1].push(Math.floor(((i-c1.width*4)/4)/c1.width));
                    }
                    else{
                        vertexdata[initialcolor] = [[], []];
                        vertexdata[initialcolor][0].push((i-c1.width*4)/4 - c1.width*Math.floor(((i-c1.width*4)/4)/c1.width));
                        vertexdata[initialcolor][1].push(Math.floor(((i-c1.width*4)/4)/c1.width));
                    }
                }
            }
            // Check left
            if(i > 0 && (imgData[i-4] == 0 && imgData[i-3] == 0 && imgData[i-2] == 0)){
                if(initialcolor != "255255255"){
                    if(vertexdata.hasOwnProperty(initialcolor)){
                        vertexdata[initialcolor][0].push((i-4)/4 - c1.width*Math.floor(((i-4)/4)/c1.width));
                        vertexdata[initialcolor][1].push(Math.floor(((i-4)/4)/c1.width));
                    }
                    else{
                        vertexdata[initialcolor] = [[], []];
                        vertexdata[initialcolor][0].push((i-4)/4 - c1.width*Math.floor(((i-4)/4)/c1.width));
                        vertexdata[initialcolor][1].push(Math.floor(((i-4)/4)/c1.width));
                    }
                }
            }
            // Check Down
            if(i < imgData.length - c1.width*4 && (imgData[i] != imgData[i+c1.width*4] || imgData[i+1] != imgData[i+1+c1.width*4] || imgData[i+2] != imgData[i+2+c1.width*4])){
                if(initialcolor != "255255255"){
                    if(vertexdata.hasOwnProperty(initialcolor)){
                        vertexdata[initialcolor][0].push(i/4 - c1.width*Math.floor((i/4)/c1.width));
                        vertexdata[initialcolor][1].push(Math.floor((i/4)/c1.width));
                    }
                    else{
                        vertexdata[initialcolor] = [[], []];
                        vertexdata[initialcolor][0].push(i/4 - c1.width*Math.floor((i/4)/c1.width));
                        vertexdata[initialcolor][1].push(Math.floor((i/4)/c1.width));
                    }
                }
                imgData[i] = 0;
                imgData[i+1] = 0;
                imgData[i+2] = 0;
                imgData[i+3] = 255;
            }
        }
        if(imgData[i] == 255 && imgData[i+1] == 255 && imgData[i+2] == 255){
            imgData[i+0] = 0;
            imgData[i+1] = 0;
            imgData[i+2] = 0;
            imgData[i+3] = 0;
        }

        if((imgData[i] != 0 || imgData[i+1] != 0 || imgData[i+2] != 0) && (imgData[i] != 255 || imgData[i+1] != 255 || imgData[i+2] != 255)){
            if(statepixels.hasOwnProperty(initialcolor)){
                statepixels[initialcolor].push(i/4);
            }
            else{
                statepixels[initialcolor] = [i/4];
            }
        }
    }
    c2 = document.getElementById("canvas2");
    let ctx2 = c2.getContext("2d");
    c2.width = c1.width;
    c2.height = c1.height;
    ctx2.putImageData(imgRawData, 0, 0);
    
}

let statemetadata;

function GenerateSpriteMap(){
    let height = 0;
    let width = 0;
    statemetadata = {};
    for(let i = 0; i < Object.keys(statepixels).length; i++){
        let leftbound = Infinity;
        let rightbound = 0;
        let lowerbound = Infinity;
        let upperbound = 0;
        let currentpixellist = statepixels[Object.keys(statepixels)[i]]
        for(let j = 0; j < currentpixellist.length; j++){
            if(currentpixellist[j] < lowerbound){
                lowerbound = currentpixellist[j];
            }
            if(currentpixellist[j] > upperbound){
                upperbound = currentpixellist[j];
            }
            if((currentpixellist[j] % c1.width) < leftbound){
                leftbound = currentpixellist[j] % c1.width;
            }
            if((currentpixellist[j] % c1.width) > rightbound){
                rightbound = currentpixellist[j] % c1.width;
            }
        }
        // Height, Width, Leftoffset, Topoffset, Cumheight
        statemetadata[Object.keys(statepixels)[i]] = [Math.floor(upperbound/c1.width) - Math.floor(lowerbound/c1.width) + 2, rightbound - leftbound + 1, leftbound, Math.floor(lowerbound/c1.width) + 1]
        height += Math.floor(upperbound/c1.width) - Math.floor(lowerbound/c1.width) + 2;
        if(rightbound - leftbound + 1 > width){
            width = rightbound - leftbound + 1;
        }
    }
    
    // Draw Spritemap

    c3 = document.getElementById("canvas3");
    let ctx3 = c3.getContext("2d")
    c3.width = width;
    c3.height = height;

    ctx3.fillStyle = "#999";
    let currentheight = 0;
    let currentwidth = 0;
    for(let i = 0; i < Object.keys(statepixels).length; i++){
        let currentpixellist = statepixels[Object.keys(statepixels)[i]]
        let currentmetadata = statemetadata[Object.keys(statemetadata)[i]]
        for(let j = 0; j < currentpixellist.length; j++){
            ctx3.fillRect(currentpixellist[j] % c1.width - currentmetadata[2], currentheight + Math.floor(currentpixellist[j]/c1.width) - currentmetadata[3], 1, 1);
        }
        currentmetadata.push(currentheight);
        currentheight += currentmetadata[0];
    }
    GetStateNames();
}

let statenamestate = 0;

function GetStateNames(){
    let ctx4;
    c4 = document.getElementById("canvas4");
    ctx4 = c4.getContext("2d");
    let ctx3 = c3.getContext("2d")
    if(statenamestate == 0){
        c4.width = c1.width;
        c4.height = c1.height;
        c2.style.display = "none";
        c4.style.display = "inline";
        ctx3.globalCompositeOperation = "source-atop";
        DrawStates(ctx4);
    }
    DrawState(ctx3, "#F00", statenamestate);
    if(statenamestate > 0){
        DrawState(ctx3, "#999", statenamestate - 1);
    }
    statenamestate++;
    DrawStates(ctx4);
}

function DrawState(ctx3, color, i){
    ctx3.fillStyle = color;
    ctx3.fillRect(0, statemetadata[Object.keys(statemetadata)[i]][4] - 1, c3.width, statemetadata[Object.keys(statemetadata)[i]][0] - 1)
}

function DrawStates(ctx4){
    let cumheight = 0;
    for(let i = 0; i < Object.keys(statemetadata).length; i++){
        let currentmetadata = statemetadata[Object.keys(statemetadata)[i]];
        ctx4.drawImage(c3, 0, cumheight - 1, currentmetadata[1], currentmetadata[0], currentmetadata[2], currentmetadata[3], currentmetadata[1], currentmetadata[0]);
        cumheight += currentmetadata[0];
    }
}