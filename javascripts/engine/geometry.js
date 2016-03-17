function CellularAutomata(glCanvas)
{
	this.glCanvas = glCanvas;

	//the size of the CA, assumes that width = height = 2^n for some n.
	this.size = glCanvas.viewportWidth;

	//stores the current state of the CA. Should be floating point values
	//we will store it in the red channel for now, but in principle one could
	//use different channels for different data (or pack data more efficiently)
	this.state = new Uint8Array(this.size*this.size*4);
	for(var i = 0 ; i < this.size*this.size ; i++)
		this.state.set([255],4*i+3);

	this.build = function()
	{
		if(!this.hasOwnProperty("vertexBuffer"))
		{
			this.vertexBuffer = this.glCanvas.createBuffer();
			this.vertexBuffer.itemSize = 2;
			this.vertexBuffer.numItems = 4;

			this.stateTexture = this.glCanvas.createTexture();

			//code to allow us to render the state to a texture
			this.frameBuffer = glCanvas.createFramebuffer();
			glCanvas.bindFramebuffer(glCanvas.FRAMEBUFFER,this.frameBuffer);

			this.updateTexture = this.glCanvas.createTexture();
			glCanvas.bindTexture(glCanvas.TEXTURE_2D,this.updateTexture);
			glCanvas.texImage2D(glCanvas.TEXTURE_2D, 0, glCanvas.RGBA, this.size, this.size, 0, glCanvas.RGBA, glCanvas.UNSIGNED_BYTE, null);
			glCanvas.texParameteri(glCanvas.TEXTURE_2D, glCanvas.TEXTURE_MAG_FILTER, glCanvas.NEAREST);
			glCanvas.texParameteri(glCanvas.TEXTURE_2D, glCanvas.TEXTURE_MIN_FILTER, glCanvas.NEAREST);

			this.renderBuffer = glCanvas.createRenderbuffer();
			glCanvas.bindRenderbuffer(gl.RENDERBUFFER,this.renderBuffer);
			glCanvas.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,this.size,this.size);
			glCanvas.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.updateTexture, 0);
			glCanvas.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer);
			glCanvas.bindRenderbuffer(gl.RENDERBUFFER,null);
			glCanvas.bindFramebuffer(gl.FRAMEBUFFER,null);
		}

		var vertices = [
			-1.0, 1.0,
			-1.0, -1.0,
			1.0, 1.0,
			1.0, -1.0];

		this.glCanvas.bindBuffer(glCanvas.ARRAY_BUFFER,this.vertexBuffer);
		this.glCanvas.bufferData(glCanvas.ARRAY_BUFFER,new Float32Array(vertices),glCanvas.STATIC_DRAW);

		glCanvas.bindTexture(glCanvas.TEXTURE_2D, this.stateTexture);
		glCanvas.texImage2D(glCanvas.TEXTURE_2D, 0, glCanvas.RGBA, this.size, this.size, 0, glCanvas.RGBA, glCanvas.UNSIGNED_BYTE, this.state);
		glCanvas.texParameteri(glCanvas.TEXTURE_2D, glCanvas.TEXTURE_MAG_FILTER, glCanvas.NEAREST);
		glCanvas.texParameteri(glCanvas.TEXTURE_2D, glCanvas.TEXTURE_MIN_FILTER, glCanvas.NEAREST);

		glCanvas.bindTexture(glCanvas.TEXTURE_2D,null);
	}

	//draw the geometry. This amounts to binding all of the textures and settings the uniforms that say how many objects we have,
	//the size of the texture that we're sending to the gpu etc...
	this.render = function () {
		glCanvas.bindBuffer(glCanvas.ARRAY_BUFFER,this.vertexBuffer);
		glCanvas.vertexAttribPointer(glCanvas.shaderProgram.vertexPositionAttribute,this.vertexBuffer.itemSize,glCanvas.FLOAT,false,0,0);

		glCanvas.activeTexture(glCanvas.TEXTURE0);
		glCanvas.bindTexture(glCanvas.TEXTURE_2D, this.stateTexture);
		glCanvas.uniform1i(glCanvas.shaderProgram.state, 0);

		glCanvas.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexBuffer.numItems);
	}

	this.update = function() {
		glCanvas.bindFramebuffer(gl.FRAMEBUFFER,this.frameBuffer);

		this.render();
		glCanvas.bindTexture(glCanvas.TEXTURE_2D, this.stateTexture);
		glCanvas.copyTexImage2D(glCanvas.TEXTURE_2D, 0, glCanvas.RGBA, 0, 0, this.size,this.size,0);
		glCanvas.bindTexture(glCanvas.TEXTURE_2D, null);

		glCanvas.bindFramebuffer(gl.FRAMEBUFFER,null);
	}

	return this;

}
