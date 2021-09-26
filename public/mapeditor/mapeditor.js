
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

let imgData, c;
let vertexdata = {};

function GenerateBorders(){
    c = document.getElementById("canvas1");
    let ctx = c.getContext("2d")
    let img = document.getElementById("myImg")
    c.width = img.width
    c.height = img.height
    ctx.drawImage(img, 0, 0)

// Finding the borders of the states and putting them into two dictionaries.
    imgRawData = ctx.getImageData(0, 0, c.width, c.height);
    imgData = imgRawData.data;
    for(let i = 0; i < imgData.length; i+=4){
        let initialcolor = "" + imgData[i]+imgData[i+1]+imgData[i+2];
        if(imgData[i] != 0 || imgData[i+1] != 0 || imgData[i+2] != 0){
            // Check Right
            if(i < imgData.length - 4 && (imgData[i] != imgData[i+4] || imgData[i+1] != imgData[i+5] || imgData[i+2] != imgData[i+6])){
                if(imgData[i+4] != 0 || imgData[i+5] != 0 || imgData[i+6] != 0){
                    if("" + imgData[i]+imgData[i+1]+imgData[i+2] != "255255255"){
                        if(vertexdata.hasOwnProperty(initialcolor)){
                            vertexdata[initialcolor][0].push(i/4 - c.width*Math.floor((i/4)/c.width));
                            vertexdata[initialcolor][1].push(Math.floor((i/4)/c.width));
                        }
                        else{
                            vertexdata[initialcolor] = [[], []];
                            vertexdata[initialcolor][0].push(i/4 - c.width*Math.floor((i/4)/c.width));
                            vertexdata[initialcolor][1].push(Math.floor((i/4)/c.width));
                        }
                    }
                    imgData[i] = 0;
                    imgData[i+1] = 0;
                    imgData[i+2] = 0;
                    imgData[i+3] = 255;
                }
            }
            // Check Up
            if(i > c.width*4 && (imgData[i-c.width*4] == 0 && imgData[i-c.width*4+1] == 0 && imgData[i-c.width*4+2] == 0)){
                if(initialcolor != "255255255"){
                    if(vertexdata.hasOwnProperty(initialcolor)){
                        vertexdata[initialcolor][0].push((i-c.width*4)/4 - c.width*Math.floor(((i-c.width*4)/4)/c.width));
                        vertexdata[initialcolor][1].push(Math.floor(((i-c.width*4)/4)/c.width));
                    }
                    else{
                        vertexdata[initialcolor] = [[], []];
                        vertexdata[initialcolor][0].push((i-c.width*4)/4 - c.width*Math.floor(((i-c.width*4)/4)/c.width));
                        vertexdata[initialcolor][1].push(Math.floor(((i-c.width*4)/4)/c.width));
                    }
                }
            }
            // Check left
            if(i > 0 && (imgData[i-4] == 0 && imgData[i-3] == 0 && imgData[i-2] == 0)){
                if(initialcolor != "255255255"){
                    if(vertexdata.hasOwnProperty(initialcolor)){
                        vertexdata[initialcolor][0].push((i-4)/4 - c.width*Math.floor(((i-4)/4)/c.width));
                        vertexdata[initialcolor][1].push(Math.floor(((i-4)/4)/c.width));
                    }
                    else{
                        vertexdata[initialcolor] = [[], []];
                        vertexdata[initialcolor][0].push((i-4)/4 - c.width*Math.floor(((i-4)/4)/c.width));
                        vertexdata[initialcolor][1].push(Math.floor(((i-4)/4)/c.width));
                    }
                }
            }
            // Check Down
            if(i < imgData.length - c.width*4 && (imgData[i] != imgData[i+c.width*4] || imgData[i+1] != imgData[i+1+c.width*4] || imgData[i+2] != imgData[i+2+c.width*4])){
                if(initialcolor != "255255255"){
                    if(vertexdata.hasOwnProperty(initialcolor)){
                        vertexdata[initialcolor][0].push(i/4 - c.width*Math.floor((i/4)/c.width));
                        vertexdata[initialcolor][1].push(Math.floor((i/4)/c.width));
                    }
                    else{
                        vertexdata[initialcolor] = [[], []];
                        vertexdata[initialcolor][0].push(i/4 - c.width*Math.floor((i/4)/c.width));
                        vertexdata[initialcolor][1].push(Math.floor((i/4)/c.width));
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
    }
    let c2 = document.getElementById("canvas2");
    let ctx2 = c2.getContext("2d");
    c2.width = c.width;
    c2.height = c.height;
    ctx2.putImageData(imgRawData, 0, 0);
}