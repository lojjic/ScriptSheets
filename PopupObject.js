/*=== Base Class for Popup Widgets ===*/

function PopupObject() {
	// Freaks out Mac IE: // if(!(this instanceof PopupObject)) return new PopupObject();
}

PopupObject.prototype = {

	popupNode : {},

	create : function(evt) {
		if(PopupObject.currentPopup) PopupObject.currentPopup.destroy();
		PopupObject.currentPopup = this;

		evt.stopPropagation(); //avoid immediate destruction
		evt.preventDefault(); //cancels link if any
		document.addEventListener("mousedown",this.destroy,false);
		window.addEventListener("keypress",this.keypressed,false);

		this.popupNode=document.createElement("div")
		this.popupNode.className="popup-node"; //default class - can override in constructor
		this.popupNode.addEventListener("mousedown",this.clicked,false);
		document.getElementsByTagName("body").item(0).appendChild(this.popupNode);
	},

	setPosition : function(evt,posString) {
		if(!posString) var posString="topleft,0,0";
		var pos=posString.split(","); //relation to cursor, x offset, y offset
		var p = PopupObject.currentPopup;

		var wW=window.innerWidth || document.body.clientWidth;
		var wH=window.innerHeight || document.body.clientHeight;
		var cX=(pos[1]) ? evt.clientX + parseInt(pos[1]) : evt.clientX;
		var cY=(pos[2]) ? evt.clientY + parseInt(pos[2]) : evt.clientY;
		var sX=window.scrollX || document.body.scrollLeft;
		var sY=window.scrollY || document.body.scrollTop;
		var pW=p.getLength("width") + p.getLength("padding-left") + p.getLength("padding-right") + 4;
		var pH=p.getLength("height") + p.getLength("padding-top") + p.getLength("padding-bottom") + 4;
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

		with (p.popupNode.style) {
			position="absolute";
			left=pX+"px"; top=pY+"px";
		}

	},

	getLength : function(prop) {
		return parseInt(getComputedStyle(this.popupNode,null).getPropertyValue(prop));
	},

	keypressed : function(evt) { //destroys popup if Esc key pressed
		if(evt.keyCode==27) {
			evt.stopPropagation();
			PopupObject.currentPopup.destroy();
		}
	},

	clicked : function(evt) { //cancel destruction when clicked
		evt.stopPropagation();
	},

	destroy : function() {
		var d = document;
		var p = PopupObject.currentPopup;
		d.getElementsByTagName("body").item(0).removeChild(p.popupNode);
		d.removeEventListener("mousedown",p.destroy,false);
		window.removeEventListener("keypress",p.keypressed,false);
		PopupObject.currentPopup=null;
	}

};