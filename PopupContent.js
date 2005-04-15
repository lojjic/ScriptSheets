/*=== Subclass that pulls existing content into a popup: ===*/

// XXX - this needs to be updated; it still uses document._PopupObject!!!

function PopupContent(elt, evt) {
	// Freaks out Mac IE: // if(!(this instanceof PopupContent)) return new PopupContent();
	this.element = elt;
	this.create();
	this.copyContent();
	this.setPosition(evt);
}
PopupContent.prototype = new PopupObject("popup-content");
PopupContent.prototype.createBase = PopupContent.prototype.create;
PopupContent.prototype.create = function(evt) {
	this.createBase(evt); 
	//Hide all <select> fields:
	var sels = document.getElementsByTagName("select");
	for(var i=0; i<sels.length; i++) sels[i].style.display="none";
}
PopupContent.prototype.destroyBase = PopupContent.prototype.destroy;
PopupContent.prototype.destroy = function() {
	this.destroyBase();
	//Show all <select> fields:
	var sels = document.getElementsByTagName("select");
	for(var i=0; i<sels.length; i++) sels[i].style.display="";

}
PopupContent.prototype.copyContent = function() {
	var elt = this.element;
	if(!elt) return;
	var newElt = elt.cloneNode(true);
	this.popupNode.appendChild(newElt);
	
	//add close button:
	var btn = document.createElement("div");
	var s = btn.style;
		s.width="13px"; s.height="13px"; s.lineHeight="10px";
		s.background="#FFF"; s.border="1px solid #333";
		s.position="absolute"; s.top="1px"; s.right="1px";
		s.textAlign="center"; s.cursor="default"; s.cursor="hand";
	
	btn.title = "Close Popup";
	var thisRef = this;
	btn.onclick = function(){thisRef.destroy();};
	btn.appendChild(document.createTextNode("x"));
	this.popupNode.appendChild(btn);
	elt.parentNode.insertBefore(this.popupNode,elt);
}
