
var options = {
	catalogs: {
		 hipparcos: true
		,hd: true
		,harvard: true
		,gliese: true
	}
	,useRelativeMagnitude: false
	,onlyProperNames: false
}

var vrDisplay;
var vrEnabled = false;

if (navigator.getVRDisplays) {
	navigator.getVRDisplays().then(function (displays) {
		if(displays.length > 0){
			vrDisplay = displays[0];
			vrEnabled = true;
		}
	});
	
}

var renderer = new Renderer();

var imageLoader = new ImageLoader();


function ImageLoader(){

	var numberLoader = new XMLHttpRequest();
	numberLoader.open("GET", "./data/numbers.dat", true);
	numberLoader.responseType = "arraybuffer";

	var stringLoader = new XMLHttpRequest();
	stringLoader.open("GET", "./data/stringsOnly.csv", true);
	stringLoader.responseType = "text";

	var stringsArray;
	var numbersView;

	var filesLoaded = 0;
	var filesToLoad = 2;

	numberLoader.onload = function (oEvent) {
		var arrayBuffer = numberLoader.response;
		console.log(arrayBuffer.length);
		if (arrayBuffer) {
			numbersView = new DataView(arrayBuffer);
			
			filesLoaded++;
			loadingBar.style.width = 100*filesLoaded/filesToLoad + "%";
			
			if(filesLoaded == filesToLoad){
				process();
			}
		} else {
			console.error("A bad happened");
		}
	};

	stringLoader.onload = function (oEvent) {
		stringsArray = stringLoader.responseText;
		if(stringsArray){
			stringsArray = stringsArray.split("\n")
			for(var i in stringsArray){
				stringsArray[i] = stringsArray[i].split(",");
			}
			filesLoaded++;
			loadingBar.style.width = 100*filesLoaded/filesToLoad + "%";
			if(filesLoaded == filesToLoad){
				process();
			}
		} else {
			console.error("A bad happened");
		}
	};

	stringLoader.send();
	numberLoader.send();

	function process(strings, numbers){

		var strings = stringsArray;
		var numbers = numbersView;
		
		var points = [];

		var sizeX = 1000;
		var sizeY = 1000;
		var sizeZ = 1000;
		var xScale = 1;
		var yScale = 1;
		var zScale = 1;

		for(var i = 0; i < numbers.byteLength/28/4; i++){
			var stringData = strings[i];

			var numbersIndex = i*28*4+ 0;

			if(
				(
					(options.catalogs.hipparcos && numbers.getFloat32(numbersIndex+1*4, false) != 0) ||
					(options.catalogs.hd && numbers.getFloat32(numbersIndex+2*4, false) != 0) ||
					(options.catalogs.harvard && numbers.getFloat32(numbersIndex+3*4, false) != 0) ||
					(options.catalogs.gliese && stringData[0] != "")
				) && (!options.onlyProperNames || stringData[2] != "")
			){
				var magnitude = 0;
				
				if(options.useRelativeMagnitude){
					magnitude = numbers.getFloat32(numbersIndex+10*4, false);
				} else {
					magnitude = numbers.getFloat32(numbersIndex+11*4, false);
				}

				points.push({
					 magnitude: magnitude
					,colorIndex: numbers.getFloat32(numbersIndex+12*4, false)
					,x: numbers.getFloat32(numbersIndex+13*4, false)
					,y: numbers.getFloat32(numbersIndex+14*4, false)
					,z: numbers.getFloat32(numbersIndex+15*4, false)
				});
				
			}
		}

		document.getElementById("points").innerHTML = "Stars: "+points.length;

		var done = renderer.addPoints(points, sizeX, sizeY, sizeZ, xScale, yScale, zScale);
		
		document.getElementById("loading").style.display = "none";
	}

	return {
		process: process
	};

}


function setBackground(div){
	document.getElementById('renderCanvas').style.backgroundColor = div.style.backgroundColor;
}














