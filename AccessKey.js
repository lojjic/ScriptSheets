
// Include this script to automatically place <em class="accesskey"></em> 
// around the (first occurrence of the) appropriate letter on links with accesskeys.


function AccessKey(elt,key) {
	this.element = elt;
	this.key = key;
	this.create();
	AccessKey.instances[AccessKey.instances.length] = this;
}
AccessKey.prototype = {
	create : function() {
		var thisRef = this;
		function checkNode(node,key) {
			if(node.nodeType==1) {
				if(node.firstChild && checkNode(node.firstChild,key)) return true;
				if(node.nextSibling && checkNode(node.nextSibling,key)) return true;
			} else if(node.nodeType==3) {
				var txt = node.nodeValue;
				var idx = txt.toLowerCase().indexOf(key.toLowerCase());
				if(idx >= 0) { //modify the node
					var modKey = (navigator.userAgent.indexOf("Mac")>=0) ? "Control" : "Alt";
					var bef = txt.substring(0,idx);
					var aft = txt.substring(idx+1);
					var par = node.parentNode;
					par.removeChild(node);
					par.appendChild(document.createTextNode(bef));
					var em = thisRef.keyWrapper = document.createElement("em");
						em.className="accesskey";
						em.setAttribute("title","Shortcut key: " + modKey + "+" + key.toUpperCase());
						em.appendChild(document.createTextNode(txt.charAt(idx)));
					par.appendChild(em);
					par.appendChild(document.createTextNode(aft));
					return true;
				}
			}
			return false;
		}
		checkNode(this.element,this.key);
	},
	destroy : function() {
		var wrap = this.keyWrapper;
		var bef = wrap.previousSibling;
		var aft = wrap.nextSibling;
		var par = wrap.parentNode;
		par.removeChild(bef);
		par.removeChild(aft);
		par.replaceChild(document.createTextNode(bef.nodeValue + this.key + aft.nodeValue), wrap);
	}
};
AccessKey.instances = [];
AccessKey.enableScriptSheet = function() {
	AccessKey.disableScriptSheet();
	var lnks = document.getElementsByTagName("a");
	for(var i=0; i<lnks.length; i++) {
		var key = lnks[i].getAttribute("accesskey");
		if(key) new AccessKey(lnks[i],key);
	}
};
AccessKey.disableScriptSheet = function() {
	var i, obj;
	for(i=0; (obj=AccessKey.instances[i]); i++) obj.destroy();
	AccessKey.instances = [];
};