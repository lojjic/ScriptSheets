
// Include this script to automatically place <em class="accesskey"></em> 
// around the (first occurrence of the) appropriate letter on links with accesskeys.


function onAccesskeyDocLoaded() {
	function checkNode(node,key) {
		if(node.nodeType==1) {
			if(node.firstChild && checkNode(node.firstChild,key)) return true;
			if(node.nextSibling && checkNode(node.nextSibling,key)) return true;
		} else if(node.nodeType==3) {
			var txt = node.nodeValue;
			var idx = txt.toLowerCase().indexOf(key.toLowerCase());
			if(idx >= 0) { //modify the node
				var before = txt.substring(0,idx);
				var after = txt.substring(idx+1);
				var pt = node.parentNode;
				pt.removeChild(node);
				pt.appendChild(document.createTextNode(before));
				var em = document.createElement("em");
					em.className="accesskey";
					em.setAttribute("title","Shortcut key: "+key.toUpperCase());
					em.appendChild(document.createTextNode(txt.charAt(idx)));
				pt.appendChild(em);
				pt.appendChild(document.createTextNode(after));
				return true;
			}
		}
		return false;
	}

	var lnks = document.getElementsByTagName("a");
	for(var i=0; i<lnks.length; i++) {
		var key = lnks[i].getAttribute("accesskey");
		if(key) checkNode(lnks[i],key);
	}
}

if(window.addEventListener) window.addEventListener("load",onAccesskeyDocLoaded,false);