/*
**  ThrowableObject script by Jason Johnston (jj@lojjic.net)
**  Created July 2002.  Use freely, but give me credit.
**
**  This script makes a specified element into an object which
**  can be dragged and "thrown" by the mouse like a ball, 
**  bouncing off the sides of the window like walls.
*/


function MouseTracker() {
	this._init();
}
MouseTracker.prototype = {
	xVelocity : 0,
	yVelocity : 0,
	_init : function() {
		var thisRef = this;
		document.onmousemove = function(event){thisRef._update(event)}; //do this the old-fashioned way since the compatibility library is too slow
	},
	_update : function(evt) {
		if(!evt) var evt = window.event;
		if(this._timeout) clearTimeout(this._timeout);

		var now = new Date();
		var timeDiff = now - this._lastTime;
		this._lastTime = now;

		var xDiff = evt.clientX - this._xPos;
		var yDiff = evt.clientY - this._yPos;
		this._xPos = evt.clientX;
		this._yPos = evt.clientY;

		this.xVelocity = xDiff / timeDiff;
		this.yVelocity = yDiff / timeDiff;

		var thisRef = this;
		this._timeout = setTimeout(function(){thisRef._decelerate()}, 1);
	},
	_decelerate : function() {
		this.xVelocity -= (this.xVelocity * .1);
		this.yVelocity -= (this.yVelocity * .1);
		var thisRef = this;
		this._timeout = setTimeout(function(){thisRef._decelerate()}, 10);
	}
}



function ThrowableObject(element,plane) {
	this.element = element;
	this.plane = plane || 0;
	this.init();
}
ThrowableObject.instances = [];
ThrowableObject.prototype = {
	falling : true, //whether it is falling at first
	gravity : .002, //pixels per ms per ms
	xPos : 0, yPos : 0,
	xVel : 0, //pixels per ms
	yVel : 0, //pixels per ms
	interval : 20,
	mouseTracker : new MouseTracker(),
	init : function() {
		var elt = this.element;
		elt.style.position = "absolute";
		elt.style.zIndex = this.plane;
		
		ThrowableObject.instances[ThrowableObject.instances.length] = this;
		
		var thisRef = this;
		elt.addEventListener("mouseover",this.onNudgeHandle=function(e){thisRef.onNudge(e)},false);
		elt.addEventListener("mousedown",this.onGrabHandle=function(e){thisRef.onGrab(e)},false);
		this.move();
	},
	move : function() {
		if(!this.element || !this.falling) return;

		var curX = this.xPos = this.getLength(this.element,"left") || 0;
		var curY = this.yPos = this.getLength(this.element,"top") || 0;
		var newX = curX + (this.xVel * this.interval);
		var newY = curY - (this.yVel * this.interval);
		
		//cache these calculations as properties for quick reuse:
		this.width = this.getLength(this.element,"width") + this.getLength(this.element,"padding-left") + this.getLength(this.element,"padding-right");
		this.height = this.getLength(this.element,"height") + this.getLength(this.element,"padding-top") + this.getLength(this.element,"padding-bottom");

		//check if colliding with object in same plane:
		var objs = ThrowableObject.instances;
		for(var i=0; i<objs.length; i++) {
			//if() break; //make one object test the other but not the other way around
			if(objs[i].plane != this.plane || objs[i] == this) continue; //only test objects in same plane
			
			var thisVel = Math.sqrt(Math.pow(this.xVel,2) + Math.pow(this.yVel,2));
			var objVel = Math.sqrt(Math.pow(objs[i].xVel,2) + Math.pow(objs[i].yVel,2));
			
			if(thisVel <= objVel) continue;
			
			if(newY + this.height > objs[i].yPos && newY < objs[i].yPos + objs[i].height &&
			   newX + this.width > objs[i].xPos && newX < objs[i].xPos + objs[i].width) {
				
				//top:
				if(curY + this.height < objs[i].yPos) {
					newY = objs[i].yPos - this.height;
					this.collide("bottom", objs[i]);
				}
				//from bottom:
				else if(curY > objs[i].yPos + objs[i].height) {
					newY = objs[i].yPos + objs[i].height;
					this.collide("top", objs[i]);
				}
				//from left:
				if(curX + this.width < objs[i].xPos) {
					newX = objs[i].xPos - this.width;
					this.collide("right", objs[i]);
				}
				//from right:
				else if(curX > objs[i].xPos + objs[i].width) {
					newX = objs[i].xPos + objs[i].width;
					this.collide("left", objs[i]);
				}				
			}
			
		}

		var rightX = this.getLength(document.documentElement,"width") - this.width;
		var bottomY = this.getLength(document.documentElement,"height") - this.height;
		if(newX < 0) {
			newX = 0;
			this.collide("left");
		}
		else if(newX > rightX) {
			newX = rightX;
			this.collide("right");
		}
		if(newY < 0) {
			newY = 0 ;
			this.collide("top");
		} 
		else if (newY > bottomY) {
			newY = bottomY;
			this.collide("bottom");
		}

		this.element.style.left = newX + "px";
		this.element.style.top  = newY + "px";

		this.yVel -= this.gravity * this.interval;

		var thisRef = this;
		setTimeout(function(){thisRef.move()},this.interval);
	},
	collide : function(side, obj) {
		if(side == "left" || side == "right") {
			if(obj) {
				var diff = this.xVel - obj.xVel;
				obj.xVel += diff / 2;
				this.xVel -= diff / 2;
			}
			this.xVel = -(this.xVel - (this.xVel * .2)); //switch directions
			this.yVel -= this.yVel * .1; //decelerate slightly
		}
		if(side == "top" || side == "bottom") {
			if(obj) {
				var diff = this.yVel - obj.yVel;
				obj.yVel += diff / 2;
				this.yVel -= diff / 2;
			}
			this.yVel = -(this.yVel - (this.yVel * .2)); //switch directions
			this.xVel -= this.xVel * .1; //decelerate slightly
		}
	},
	onNudge : function(evt) {
		this.falling = true;
		this.xVel = this.mouseTracker.xVelocity;
		this.yVel = -this.mouseTracker.yVelocity;
	},
	onGrab : function(evt) {
		this.falling = false;
		this.mouseX = evt.clientX;
		this.mouseY = evt.clientY;
		var thisRef = this;
		document.addEventListener("mousemove",this.onDragHandle=function(e){thisRef.onDrag(e)},false);
		document.addEventListener("mouseup",this.onThrowHandle=function(e){thisRef.onThrow(e)},false);
	},
	onDrag : function(evt) {
		this.element.style.left = (this.getLength(this.element,"left") - this.mouseX + (this.mouseX=evt.clientX)) + "px";
		this.element.style.top = (this.getLength(this.element,"top") - this.mouseY + (this.mouseY=evt.clientY)) + "px";
	},
	onThrow : function(evt) {
		this.falling = true;
		this.xVel = this.mouseTracker.xVelocity;
		this.yVel = -this.mouseTracker.yVelocity;
		document.removeEventListener("mousemove",this.onDragHandle,false);
		document.removeEventListener("mouseup",this.onThrowHandle,false);
		this.move();
	},
	getLength : function(elt,prop) { //utility to get current computed lengths
		return parseFloat(getComputedStyle(elt,null).getPropertyValue(prop));
	}
};
