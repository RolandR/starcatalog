var fragmentShader = `

precision mediump float;
varying lowp vec4 vColor;

void main(void){
	//gl_FragColor = vec4(vColor.xyz, vColor.w * vColor.w * 0.4);
	//gl_FragColor = vColor;

	vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
	if (dot(circCoord, circCoord) > 1.0) {
		discard;
	}
	
	gl_FragColor = vec4(vColor.rgb, 1.0);
}

`;

