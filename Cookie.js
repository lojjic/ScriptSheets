/*
var cookie = new Cookie("cookieName");
	var val = cookie.value("setToValue");
	
TODO:
	* Allow data structure: {key:val,key:[val1,val2]} and transparent in/out

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
			
			function decodeValue(str) {  {{{{}}}}
				switch(str.charAt(0)) {
					case "{": //object
						var obj = {};
						if(str.indexOf(":") != -1) {
							var props = str.slice(1,-1).split(",");
							for(var i=0; i<props.length; i++) {
								var keyVal = props[i].split(":");
								obj[keyVal[0]] = decodeValue(unescape(keyVal[1]));
							}
						}
						return obj;
					case "[": //array
						var arr = [];
						var members = str.slice(1,-1).split(",");
						for(var i=0; i<members.length; i++) {
							arr[arr.length] = decodeValue(unescape(members[i]));
						}
						return arr;
					case "t": //boolean
						return true;
					case "f":
						return false;
					case "'": //string
						return unescape(str.slice(1,-1));
					default: //number
						var num = Number(str);
						return (num == "NaN") ? str : num;
				}
			}
			return decodeValue(unescape(value));
		}
		return "";
	},
	setValue : function(setTo) {
		function encodeData(data) {
			switch(typeof data) {
				case "object":
					var strVal = "";
					var idx = 0;
					var isArray = (data.constructor == Array);
					strVal += isArray ? "[" : "{";
					for(var prop in data) {
						if(idx++) strVal += ","; //if not first, add comma
						if(!isArray) strVal += escape(prop) + ":";
						strVal += escape(encodeData(data[prop]));
					}
					strVal += isArray ? "]" : "}";
					return strVal;
				case "string":
					return "'" + escape(data) + "'";
				case "number":
					return data;
				case "boolean":
					return (data ? "true" : "false");
			}
		}
		this.value = encodeData(setTo);
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
