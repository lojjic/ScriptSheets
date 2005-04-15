var p = PopupObject.prototype;

p.opacity = 0,
p.fadeIn = function() {
	if(this.opacity > 100) return;
	this.popupNode.style.MozOpacity = this.opacity + "%";
	this.popupNode.style.filter = "alpha(opacity=" + this.opacity + ")";
	this.opacity += 10;
	var thisRef = this;
	setTimeout(function(){thisRef.fadeIn()},30);
}

p.clipping = 0,
p.swipeIn = function() { //bleech! works poorly.
	// TODO: let user specify direction of swipe in parameter
	if(this.clipping > 110) return;
	this.popupNode.style.clip = "rect(0," + this.clipping + "px,100%,0)";
	this.clipping += 10;
	var thisRef = this;
	setTimeout(function(){thisRef.swipeIn()},30);
}
