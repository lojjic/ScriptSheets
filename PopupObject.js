/*=== Base Class for Popup Widgets ===*/

function PopupObject(type) {
	// Freaks out Mac IE: // if(!(this instanceof PopupObject)) return new PopupObject();
	this.popupType = type || "popup-object";
}

PopupObject.prototype = {

	popupNode : {},

	create : function(evt) {
		PopupObject.destroyType(this.popupType);
		var thisRef = PopupObject.popupsByType[this.popupType] = this;

		if(evt) {
			evt.stopPropagation(); //avoid immediate destruction
			evt.preventDefault(); //cancels link if any
		}
		document.addEventListener("mousedown",this.docMousedownHandler=function(){thisRef.destroy()},false);
		window.addEventListener("keypress",this.docKeypressHandler=function(evt){thisRef.keypressed(evt)},false);

		this.popupNode=document.createElement("div")
		this.popupNode.className=this.popupType; //default class - can override in constructor
		this.popupNode.addEventListener("mousedown",this.pressed,false);
		this.parentElement().appendChild(this.popupNode);
	},

	setPosition : function(evt,posString) {
		if(!posString) var posString="topleft,0,0";
		var pos=posString.split(","); //relation to cursor, x offset, y offset
		
		this.popupNode.style.position="absolute";
		var wW=window.innerWidth || document.body.clientWidth;
		var wH=window.innerHeight || document.body.clientHeight;
		var cX=(pos[1]) ? evt.clientX + parseInt(pos[1]) : evt.clientX;
		var cY=(pos[2]) ? evt.clientY + parseInt(pos[2]) : evt.clientY;
		var sX=window.scrollX || document.body.scrollLeft;
		var sY=window.scrollY || document.body.scrollTop;
		var pW=this.getLength("width") + this.getLength("padding-left") + this.getLength("padding-right") + 4;
		var pH=this.getLength("height") + this.getLength("padding-top") + this.getLength("padding-bottom") + 4;
		var pX=cX; var pY=cY;

		if(pos[0]=="centered") { //centered on screen
			pX = wW/2 - pW/2 + (parseInt(pos[1])||0);
			pY = wH/2 - pH/2 + (parseInt(pos[2])||0);
		}
		if(pos[0].indexOf("right")>=0) pX=pX+sX-pW;
		else pX+=sX;
		if(pos[0].indexOf("bottom")>=0) pY=pY+sY-pH;
		else pY+=sY;

		if(pX-sX+pW > wW) pX=wW+sX-pW-2;
		if(pY-sY+pH > wH) pY=wH+sY-pH-2;
		if(pX-sX < 2) pX=sX+2;
		if(pY-sY < 2) pY=sY+2;

		with (this.popupNode.style) {
			left=pX+"px"; top=pY+"px";
		}
		//window.status = pX + " x " + pY;
	},

	getLength : function(prop) {
		return parseFloat(getComputedStyle(this.popupNode,null).getPropertyValue(prop));
	},

	parentElement : function() {
		return document.getElementsByTagName("body").item(0);
	},

	keypressed : function(evt) { //destroys popup if Esc key pressed
		if(evt.keyCode==27) {
			evt.stopPropagation();
			this.destroy();
		}
	},

	pressed : function(evt) { //cancel destruction when clicked
		evt.stopPropagation();
	},

	destroy : function() {
		var d = document;
		var thisRef = this;
		if(this.popupNode.parentNode) this.parentElement().removeChild(this.popupNode);
		PopupObject.popupsByType[this.popupType]=null;
		setTimeout(function(){
			d.removeEventListener("mousedown",thisRef.docMousedownHandler,false);
			window.removeEventListener("keypress",thisRef.docKeypressHandler,false);
		},0);
	}
};

PopupObject.popupsByType = {}; //holds hash of each active popup by type
PopupObject.destroyType = function(type) { //destroys all of given type
	if(type && this.popupsByType[type]) this.popupsByType[type].destroy();
}