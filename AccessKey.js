/*
**  AccessKey script by Jason Johnston (jj@lojjic.net)
**  Created January 2003.  Use freely, but give me credit.
**
**  This script will place <em class="accesskey"></em> 
**  around the first occurrence of a link's accesskey.
*/


function AccessKey(elt) {
	this.element = elt;
	this.create();
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
		checkNode(this.element, this.element.getAttribute("accesskey"));
	},
	destroy : function() {
		var wrap = this.keyWrapper;
		var bef = wrap.previousSibling;
		var aft = wrap.nextSibling;
		var par = wrap.parentNode;
		par.removeChild(bef);
		par.removeChild(aft);
		par.replaceChild(document.createTextNode(bef.nodeValue + wrap.firstChild.nodeValue + aft.nodeValue), wrap);
	}
};
AccessKey.scriptSheetSelector = "a[accesskey]";