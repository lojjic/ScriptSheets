/*
**  TitleTip script by Jason Johnston (jj@lojjic.net)
**  Created July 2002.  Use freely, but give me credit.
**
**  Use this script to create CSS-styleable, more
**  responsive tooltips containing the contents of the
**  title="..." attribute on any element in the document.
*/


function TitleTip(elt) {
	this.element = elt;
	this.create();
	TitleTip.instances[TitleTip.instances.length] = this;
}
TitleTip.prototype = {
	create : function() {
		this.element.addEventListener("mouseover", this.mouseOverHandler = function(evt){new TitleTipPopup(evt);}, false);
	},
	destroy : function() {
		this.element.removeEventListener("mouseover", this.mouseOverHandler, false);
	}
};
TitleTip.instances = [];
TitleTip.enableScriptSheet = function() {
	TitleTip.disableScriptSheet();
	var elts = document.all || document.getElementsByTagName("*");
	for(var i=0; i<elts.length; i++) {
		if(elts[i].getAttribute("title")) new TitleTip(elts[i]);
	}
};
TitleTip.disableScriptSheet = function() {
	var i, inst;
	for(i=0; (inst=TitleTip.instances[i]); i++) {
		inst.destroy();
	}
	TitleTip.instances = [];
}






function TitleTipPopup(evt) {
	// Freaks out Mac IE: // if(!(this instanceof TitleTip)) return new TitleTip(evt);
	this.create(evt);
	this.buildTip(evt);
	this.setPosition(evt);
}

TitleTipPopup.prototype = new PopupObject("titletip"); //inherit from base PopupObject class

TitleTipPopup.prototype.buildTip = function(evt) {
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
TitleTipPopup.prototype.setPositionBase = TitleTipPopup.prototype.setPosition;
TitleTipPopup.prototype.setPosition = function(evt) {
	this.setPositionBase(evt,"topleft,16,16");
}

TitleTipPopup.prototype.pressed = function(){return;}; //clicking on titletip destroys it
TitleTipPopup.prototype.destroyBase = TitleTipPopup.prototype.destroy;
TitleTipPopup.prototype.destroy = function() {
	var elt = this.element;
	window.status = "";
	elt.removeEventListener("mousemove",this.eltMousemoveHandler,false);
	elt.removeEventListener("mouseout",this.eltMouseoutHandler,false);
	elt.title = this.title; //add attribute back in
	//p.popupNode.style.display="none"; //prevent repaint bug in IE5
	this.destroyBase();
}