/*
**  ImageShadow script by Jason Johnston (jj@lojjic.net)
**  Created August 2003.  Use freely, but give me credit.
**
**  This script adds a configurable, alpha-transparent
**  drop shadow to an image.  For usage and details see
**  ImageShadow-doc.html.
*/

/*
TODO:
	* Make bottom-right positioned image's shadow move with image when window resized 
	  (currently getComputedStyle is returning pixel values for top and left when 
	  they're really "auto", so they take precedence.)
*/

function ImageShadow(elt, opts) { // opts is hash object: {feather:N, offsetX:N, (etc.)}
	this.element = elt;
	if(!opts) var opts = {};
	this.feather = parseInt(opts.feather) || 8;
	this.offsetX = parseInt(opts.offsetX) || 8;
	this.offsetY = parseInt(opts.offsetY) || 8;
	this.darkness = parseInt(opts.darkness) || 50;
	this.create();
	var i = ImageShadow.instances;
	i[i.length] = this;
}
ImageShadow.prototype = {
	create : function() {
		var elt = this.element;
		
		//shortcut to get comp. style:
		var cS = function(prop) {return getComputedStyle(elt, null).getPropertyValue(prop);}

		var imgDisp = cS("display");
		var imgPos = cS("position");
		var imgW = parseFloat(cS("width")) || 0;
		var imgH = parseFloat(cS("height")) || 0;
		var imgZ = cS("z-index");
		if(imgZ == "auto") imgZ = elt.style.zIndex = 1;
		
		var cont = this.container = document.createElement("span");
		var c = cont.style;
			c.position = "absolute";
			c.zIndex = imgZ - 1;
		
		if(imgPos == "static") elt.style.position = "relative";
		if(imgPos == "absolute" || imgPos == "fixed") { //replaced:
			c.left = cS("left");
			c.top = cS("top");
			c.bottom = cS("bottom");
			c.right = cS("right");
		} else { //in flow:
			if(imgDisp == "inline") c.marginLeft = -imgW + "px";
			else c.marginTop = -imgH + "px";
		}

		this.shadows = [];
		this.shadows[0] = document.createElement("span");
		var fthr = this.feather;
		var dark = this.darkness;
		for(var i=0; i<fthr; i++) {
			var shadow = this.shadows[i] = document.createElement("span");
			var s = shadow.style;
				s.position = "absolute"; 
				s.left = (this.offsetX - i + fthr/2) + "px"; 
				s.top = (this.offsetY - i + fthr/2) + "px";
				s.width = (imgW + 2*i - fthr) + "px";
				s.height = (imgH + 2*i - fthr) + "px";
				
				var opacity = dark - (dark/fthr*i);
				s.border = "1px solid #000";
				if(i==0) s.background = "#000"; //innermost is solid
				s.MozOpacity = s.opacity = opacity/100; //Moz and eventually W3C
				s.filter = "alpha(opacity=" + opacity + ")"; //MSIE
			cont.appendChild(shadow);
		}
		elt.parentNode.insertBefore(cont, elt.nextSibling);
		
	},
	destroy : function() {
		for(var i in this.shadows) this.container.removeChild(this.shadows[i]);
		this.element.parentNode.removeChild(this.container);
		var s = this.element.style;
		s.zIndex = s.position = "";
	}
};
ImageShadow.instances = [];
ImageShadow.enableScriptSheet = function() {
	ImageShadow.disableScriptSheet();
	var imgs = document.getElementsByTagName("img");
	for(var i=0; i<imgs.length; i++) {
		if(imgs[i].className.match(/\bshadow\b/)) new ImageShadow(imgs[i], {/*defaults*/});
	}
};
ImageShadow.disableScriptSheet = function() {
	var i, inst;
	for(i=0; (inst=ImageShadow.instances[i]); i++) inst.destroy();
	ImageShadow.instances = [];
};
