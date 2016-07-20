var autorotate = document.getElementById("autorotate").checked;

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

	var moving = false;
	var panning = false;
	var moveStartX = 0;
	var moveStartY = 0;
	var lastX = 0;
	var lastY = 0;
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
				translateX += (deltaX - lastX)*0.0003;
				translateY += (deltaY - lastY)*0.0003;
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
	});

	canvas.addEventListener('wheel', function(e) {
		//console.log(e.deltaY);
		if(e.shiftKey){
			zoom += zoom * 0.001 * e.deltaX;
		} else {
			translateZ += e.deltaY * 0.0001;
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

	var angleX = 0;
	var angleY = 0;

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

			values[i] = (points[i].magnitude + 25)/100 + 2;

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

			
		}

		
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
			if(autorotate && panX == 0 && panY == 0){
				angleX += 0.001;
			}
			angleX += panX*0.0015;
			panX = 0;
			var c = Math.cos(angleX);
			var s = Math.sin(angleX);
			
			rotationMatrix = [
				c, 0, s, 0,
				0, 1, 0, 0,
				-s, 0, c, 0,
				0,  0, 0, 1
			];

			angleY += panY*0.0015;
			panY = 0;
			var c = Math.cos(angleY);
			var s = Math.sin(angleY);
			
			var yRotationMatrix = [
				1, 0,  0, 0,
				0, c, -s, 0,
				0, s,  c, 0,
				0, 0,  0, 1,
			];

			rotationMatrix = matrix4Multiply(rotationMatrix, yRotationMatrix);
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

	
	return{
		 addPoints: addPoints
	}
}












