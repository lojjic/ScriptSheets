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
	//this.fadeIn(); //remove this function call if you don't want fading.
	//this.swipeIn(); //remove this function call if you don't want swiping in.
}

TitleTip.prototype = new PopupObject(); //inherit from base PopupObject class

TitleTip.prototype.buildTip = function(evt) {
	var elt = this.element = evt.currentTarget;
	var ttl = this.title = elt.title;
	elt.title = ""; //temporarily remove it to avoid normal tooltip

	elt.addEventListener("mousemove",this.setPosition,false);
	elt.addEventListener("mouseout",this.destroy,false);

	var node = this.popupNode;
		node.className="titletip-node";
		node.appendChild(document.createTextNode(ttl));
}
TitleTip.prototype.setPositionBase = TitleTip.prototype.setPosition;
TitleTip.prototype.setPosition = function(evt) {
	PopupObject.currentPopup.setPositionBase(evt,"topleft,16,16");
}

TitleTip.prototype.opacity = 0;
TitleTip.prototype.fadeIn = function() {
	var tt = PopupObject.currentPopup;
	if(!tt || tt.opacity > 100) return;
	tt.popupNode.style.MozOpacity = tt.opacity + "%";
	tt.popupNode.style.filter = "alpha(opacity=" + tt.opacity + ")";
	tt.opacity += 10;
	setTimeout(PopupObject.currentPopup.fadeIn,30);
}
TitleTip.prototype.clipping = 0;
TitleTip.prototype.swipeIn = function() { //bleech! works poorly.
	var tt = PopupObject.currentPopup;
	if(!tt || tt.clipping > 110) return;
	tt.popupNode.style.clip = "rect(0," + tt.clipping + "px,100%,0)";
	tt.clipping += 10;
	setTimeout(PopupObject.currentPopup.swipeIn,30);
}
TitleTip.prototype.destroyBase = TitleTip.prototype.destroy;
TitleTip.prototype.destroy = function() {
	var p = PopupObject.currentPopup;
	p.element.removeEventListener("mousemove",p.setPosition,false);
	p.element.removeEventListener("mouseout",p.destroy,false);
	p.element.title = p.title; //add attribute back in
	//p.popupNode.style.display="none"; //prevent repaint bug in IE5
	p.destroyBase();
}




function onTitleTipsDocLoaded(evt) {
	var allElts = document.all || document.getElementsByTagName("*");
	for(var i=0; i<allElts.length; i++) {
		var elt = allElts[i];
		if(elt.getAttribute("title")) elt.addEventListener("mouseover",function(evt){new TitleTip(evt)},false);
	}
}
if(window.addEventListener) window.addEventListener("load",onTitleTipsDocLoaded,false);
