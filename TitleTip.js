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
	var i=TitleTip.instances;
	i[i.length] = this;
}
TitleTip.prototype = {
	create : function() {
		this.element.addEventListener("mouseover", this.mouseOverHandler=function(evt){new TitleTipPopup(evt);}, false);
	},
	destroy : function() {
		this.element.removeEventListener("mouseover", this.mouseOverHandler, false);
	}
};
TitleTip.instances = [];
TitleTip.enableScriptSheet = function() {
	TitleTip.disableScriptSheet();
	var elts = document.all || document.getElementsByTagName("*");
	var i, elt;
	for(i=0; (elt=elts[i]); i++) 
		if(elt.getAttribute("title")) new TitleTip(elt);
};
TitleTip.disableScriptSheet = function() {
	var i, inst;
	for(i=0; (inst=TitleTip.instances[i]); i++) inst.destroy();
	TitleTip.instances = [];
}






function TitleTipPopup(evt) {
	this.create(evt);
	this.buildTip(evt);
	this.setPosition(evt);
}

TitleTipPopup.prototype = new PopupObject("titletip"); //inherit from base PopupObject class

TitleTipPopup.prototype.buildTip = function(evt) {
	var elt = this.element = evt.currentTarget;
	var ttl = this.title = elt.title;
	elt.title = ""; //temp. remove title to prevent browser tooltip
	var lnk=elt; while(lnk=lnk.parentNode) if(lnk.href) window.status = lnk.href; //if within a link, put href in status bar

	var thisRef = this;
	elt.addEventListener("mousemove",this.mousemoveHandler=function(evt){thisRef.setPosition(evt);},false);
	elt.addEventListener("mouseout",this.mouseoutHandler=function(){thisRef.destroy()},false);

	var node = this.popupNode;
	node.appendChild(document.createTextNode(ttl));
}
TitleTipPopup.prototype._tmpSetPos = TitleTipPopup.prototype.setPosition;
TitleTipPopup.prototype.setPosition = function(evt) {
	this._tmpSetPos(evt,"topleft,16,16");
}

TitleTipPopup.prototype.pressed = function(){return;}; //clicking on tip destroys it
TitleTipPopup.prototype.destroyBase = TitleTipPopup.prototype.destroy;
TitleTipPopup.prototype.destroy = function() {
	var elt = this.element;
	window.status = "";
	elt.removeEventListener("mousemove",this.mousemoveHandler,false);
	elt.removeEventListener("mouseout",this.mouseoutHandler,false);
	elt.title = this.title; //add back in
	this.destroyBase();
}
