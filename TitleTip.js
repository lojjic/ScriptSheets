/*
**  TitleTip script by Jason Johnston (jj@lojjic.net)
**  Created July 2002.  Use freely, but give me credit.
**
**  Use this script to create CSS-styleable, more
**  responsive tooltips containing the contents of the
**  title="..." attribute on any element in the document.
*/




function TitleTip(evt) {
	// Freaks out Mac IE: // if(!(this instanceof TitleTip)) return new TitleTip(evt);
	this.create(evt);
	this.buildTip(evt);
	this.setPosition(evt);
}

TitleTip.prototype = new PopupObject("titletip"); //inherit from base PopupObject class

TitleTip.prototype.buildTip = function(evt) {
	var elt = this.element = evt.currentTarget;
	var ttl = this.title = elt.title;
	elt.title = ""; //temporarily remove it to avoid normal tooltip
	if(elt.href) window.status = elt.href;

	var thisRef = this;
	elt.addEventListener("mousemove",this.eltMousemoveHandler=function(evt){
		//Reduce movement to no more than once per 20ms:
		var now = new Date();
		if(thisRef.lastMovedTime && now - thisRef.lastMovedTime < 20) return;
		thisRef.lastMovedTime = now;
		thisRef.setPosition(evt); //move it
	},false);
	elt.addEventListener("mouseout",this.eltMouseoutHandler=function(){thisRef.destroy()},false);

	var node = this.popupNode;
	node.appendChild(document.createTextNode(ttl));
}
TitleTip.prototype.setPositionBase = TitleTip.prototype.setPosition;
TitleTip.prototype.setPosition = function(evt) {
	this.setPositionBase(evt,"topleft,16,16");
}

TitleTip.prototype.pressed = function(){return;}; //clicking on titletip destroys it
TitleTip.prototype.destroyBase = TitleTip.prototype.destroy;
TitleTip.prototype.destroy = function() {
	var elt = this.element;
	window.status = "";
	elt.removeEventListener("mousemove",this.eltMousemoveHandler,false);
	elt.removeEventListener("mouseout",this.eltMouseoutHandler,false);
	elt.title = this.title; //add attribute back in
	//p.popupNode.style.display="none"; //prevent repaint bug in IE5
	this.destroyBase();
}



function onTitleTipsDocLoaded(evt) {
	var allElts = document.all || document.getElementsByTagName("*");
	for(var i=0; i<allElts.length; i++) {
		var elt = allElts[i];
		if(elt.getAttribute("title")) elt.addEventListener("mouseover",function(evt){new TitleTip(evt)},false);
	}
}
if(window.addEventListener) window.addEventListener("load",onTitleTipsDocLoaded,false);
