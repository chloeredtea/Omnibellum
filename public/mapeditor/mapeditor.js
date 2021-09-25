
// Loading uploaded image into memory
// Black box -- DO NOT TOUCH
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
        if(imgData[i] == 255 && imgData[i+1] == 255 && imgData[i+2] == 255){
            imgData[i+0] = 255;
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