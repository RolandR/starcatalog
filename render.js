function Renderer(){

	var canvas = document.getElementById('renderCanvas');
	
	window.onresize = function(){

		var pxRatio = window.devicePixelRatio || 1;
		
		canvas.width = ~~(canvasContainer.offsetWidth * pxRatio);
		canvas.height = ~~(canvasContainer.offsetHeight * pxRatio);
		
		width = canvas.width;
		height = canvas.height;		
	}

	window.onresize();

	var zoom = 0.8;
	
	var translateX = 0;
	var translateY = 0;
	var translateZ = 0.2;

	/*var moving = false;
	var panning = false;
	var moveStartX = 0;
	var moveStartY = 0;
	var lastX = 0;
	var lastY = 0;
	var moveX = 0;
	var moveY = 0;
	var moveZ = 0;
	var panX = 0;
	var panY = 0;

	var lastPose = [0, 0, 0];
	var poseDiff = [0, 0, 0];

	canvas.addEventListener('mousemove', function(e) {
		if(panning || moving){
			var deltaX = e.screenX - moveStartX;
			var deltaY = e.screenY - moveStartY;
			if(panning){
				panX += deltaX - lastX;
				panY += deltaY - lastY;
			} else if(moving){
				moveX += deltaX - lastX;
				moveZ += deltaY - lastY;
			}
			lastX = deltaX;
			lastY = deltaY;
		}
	});

	canvas.addEventListener('mousedown', function(e) {
		if(e.buttons == 1){
			moving = true;
		} else if(e.buttons == 2){
			panning = true;
			e.preventDefault();
		}
		moveStartX = e.screenX;
		moveStartY = e.screenY;
	});

	canvas.addEventListener('mouseup', function(e) {
		moving = false;
		panning = false;
		moveStartX = 0;
		moveStartY = 0;
		lastX = 0;
		lastY = 0;
		panX = 0;
		panY = 0;
	});*/

	canvas.addEventListener('wheel', function(e) {
		//console.log(e.deltaY);
		if(e.shiftKey){
			zoom += zoom * 0.001 * e.deltaX;
		} else {
			translateZ += e.deltaY * 0.001;
		}
		return false;
	});

	canvas.addEventListener('touchend', function(e) {
		if (document.fullscreenEnabled) {
			document.documentElement.requestFullscreen();
		} else if (document.webkitFullscreenEnabled) {
			document.documentElement.webkitRequestFullscreen();
		} else if (document.mozFullScreenEnabled) {
			document.documentElement.mozRequestFullScreen();
		}
		
		document.getElementById("controls").style.display = "none";
		document.getElementById("canvasContainer").style.left = "0px";
	});
	
	var objectSize = 4;
	
	var objects;
	var colors;
	var values;
	var rendering = false;

	var angle = 0;

	var glRenderer = new PointRenderer("renderCanvas");
	
	function addPoints(points, xDim, yDim, zDim, xScale, yScale, zScale){
		
		colors = new Float32Array(objectSize*points.length);
		objects = new Float32Array(objectSize*points.length);
		values = new Float32Array(points.length);

		var r = 1;
		
		for(var i = 0; i < points.length; i++){
			
			objects[i*objectSize  ] = (points[i].x*xScale) / xDim;
			objects[i*objectSize+2] = (points[i].y*yScale) / yDim;
			objects[i*objectSize+1] = -(points[i].z*zScale) / zDim;

			values[i] = (points[i].magnitude + 25)/100 + 3;

			if(values[i] < 0){
				values[i] = 1;
			}

			if(points[i].colorIndex){
				var color = bv2rgb(points[i].colorIndex);
				
				colors[i*objectSize  ] = color[0];
				colors[i*objectSize+1] = color[1];
				colors[i*objectSize+2] = color[2];
				
			} else {
				
				colors[i*objectSize  ] = 1.0;
				colors[i*objectSize+1] = 1.0;
				colors[i*objectSize+2] = 1.0;
			}


			//if(orientation == "axial"){
				//rotateY(i*objectSize, [Math.sin(Math.PI/2), Math.cos(Math.PI/2)], rotateCenter );
			//}
			
		}

		//changeTransferImage(colorImg);
		
		glRenderer.addVertices(objects, colors, values);

		if(!rendering){
			render();
			rendering = true;
		}

		return true;
	}

	function render(){

		var rotationMatrix;
		
		if(vrEnabled){
			var orientation = vrDisplay.getPose().orientation;
			orientation = [-orientation[0], -orientation[1], orientation[2], orientation[3]];
			rotationMatrix = matrix4FromQuaternion(orientation);
		} else {
			angle += 0.003;
			var c = Math.cos(angle);
			var s = Math.sin(angle);
			
			rotationMatrix = [
				c, 0, s, 0,
				0, 1, 0, 0,
				-s, 0, c, 0,
				0,  0, 0, 1
			];
		}
		
		if(vrEnabled){
			var translationMatrix = makeTranslationMatrix([translateX, translateY, translateZ + 0.6]);
			var depth = 800;
			var scaleMatrix = makeScaleMatrix([1/(canvas.width/2), 1/canvas.height, 1/depth]);
			
		} else {
			
			var translationMatrix = makeTranslationMatrix([translateX, translateY, translateZ]);
			var depth = 800;
			var scaleMatrix = makeScaleMatrix([1/canvas.width, 1/canvas.height, 1/depth]);
		}

		var transformMatrix =  matrix4Multiply(rotationMatrix, translationMatrix);
		transformMatrix =  matrix4Multiply(transformMatrix, scaleMatrix);
		
		glRenderer.render(transformMatrix, zoom);
			
		window.requestAnimationFrame(render);
	}

	function changeTransferImage(image, updateRenderer){

		var colorMap = document.createElement('canvas');
		var colorMapContext = colorMap.getContext('2d');
		colorMap.width = 256;
		colorMap.height = 1;
		colorMapContext.drawImage(image, 0, 0);
		var colorMapping = colorMapContext.getImageData(0, 0, 256, 1).data;
		
		//colors = new Uint8ClampedArray(colors.length);
		
		for(var a = 0; a < objects.length; a+=objectSize){
			
			colors[a  ] = colorMapping[~~(values[~~(a/objectSize)]*4)  ] / 255;
			colors[a+1] = colorMapping[~~(values[~~(a/objectSize)]*4)+1] / 255;
			colors[a+2] = colorMapping[~~(values[~~(a/objectSize)]*4)+2] / 255;
			colors[a+3] = colorMapping[~~(values[~~(a/objectSize)]*4)+3] / 255;
			//colors[a+3] = values[~~(a/objectSize)] / 255;
			
		}

		if(updateRenderer){
			glRenderer.setColors(colors);
		}

		return colors;
	}

	
	return{
		 addPoints: addPoints
		,changeTransferImage: changeTransferImage
	}
}

function changeTransferImage(file){
	//console.log(file[0]);
	file = window.URL.createObjectURL(file[0]);
	var image = new Image();
	image.src = file;

	//console.log(colorMapping);
	image.onload = function(){renderer.changeTransferImage(image, true)};
}

















