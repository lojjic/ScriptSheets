/*
var cookie = new Cookie("cookieName");
	var val = cookie.value("setToValue");
*/



function Cookie(name) {
	this.name = name;
}
Cookie.prototype = {
	getValue : function() {
		if(this.value) return this.value;
		var str = document.cookie;
		var pos = str.indexOf(this.name + "=");
		if(pos != -1) {
			var start = pos + this.name.length + 1;
			var end = str.indexOf(";", start);
			if(end == -1) end = str.length;
			var value = str.substring(start, end);
			return unescape(value);
		}
		return "";
	},
	setValue : function(setTo) {
		this.value = setTo;
		this.bake();
		return setTo;
	},
	setExpires : function(setTo) {
		if (typeof setTo == "Date") setTo = setTo.toUTCString(); //allow Date objects
		this.expires = setTo;
		this.bake();
		return setTo;
	},
	setLifespan : function(seconds) { // get/set minutes to expiration
		var expDate = new Date();
		expDate.setTime(expDate.getTime() + (seconds * 1000));
		return this.setExpires(expDate.toUTCString());
	},
	setDomain : function(setTo) {
		this.domain = setTo;
		this.bake();
		return setTo;
	},
	setPath : function(setTo) {
		this.path = setTo;
		this.bake();
		return setTo;
	},
	setSecure : function(setTo) {
		this.secure = setTo;
		this.bake();
		return setTo;
	},
	forget : function() {
		this.setLifespan(-1);
	},
	
	bake : function() { //assembles and commits the cookie string. The user need not call this if one of the above methods is used.
		var val = this.value || this.getValue();
		if(!val) return; //silently fail if no value set
		var str = this.name + "=" + escape(val);
		if(this.expires) str += "; expires=" + this.expires;
		if(this.domain)  str += "; domain=" + this.domain;
		if(this.path)    str += "; path=" + this.path;
		if(this.secure)  str += "; secure";
		document.cookie = str;
	}
};
