
/*

TODO:
	* Make keyboard-navigable (insert <a>s around branch labels)

ISSUES:
	* If <li> IDs are different across pages, persistence will be wrong (maybe associate URIs with IDs?)

*/


function TreeMenu(elt) {
	this.element = elt;
	this.create();
	TreeMenu.instances[TreeMenu.instances.length] = this;
}
TreeMenu.prototype = {
	create : function() {
		var i, li;
		this.element.className += " tree-menu";
		this.menuNodes = [];
		for(i=0; (li=this.element.getElementsByTagName("li")[i]); i++) {
			if(li.getElementsByTagName("ul")) this.menuNodes[this.menuNodes.length] = new TreeMenuNode(li);
		}
	},
	
	destroy : function() {
		var i, node;
		for(i=0; (node=this.menuNodes[i]); i++) {
			node.destroy();
		}
		this.element.className = this.element.className.replace("tree-menu","");
	}
};
TreeMenu.instances = [];
TreeMenu.enableScriptSheet = function() {
	TreeMenu.disableScriptSheet();
	var uls = document.getElementsByTagName("ul");
	for(i=0; i<uls.length; i++) {
		if(uls[i].className.match(/\s*navigation\s*/)) new TreeMenu(uls[i]);
	}
};
TreeMenu.disableScriptSheet = function() {
	var i, menu;
	for(i=0; (menu=TreeMenu.instances[i]); i++) {
		menu.destroy();
	}
	TreeMenu.instances = [];
};



function TreeMenuNode(elt) {
	this.element = elt;
	this.create();
}
TreeMenuNode.prototype = {
	create : function() {
		var s, v, h, i, j;
		s = this.element.style;
			s.position="relative"; s.display="block"; s.listStyleType="none";
		
		//create dotted lines:
		v = this.outlineVert = document.createElement("div");
			s = v.style; s.position="absolute"; s.top="0"; s.left="6px"; s.height="100%"; s.borderLeft="1px dotted";
			var isLast=true; var e=this.element; while(e=e.nextSibling) if(e.nodeType==1) isLast=false; //is it the last node?
			if(isLast) s.height="8px";
		h = this.outlineHoriz = document.createElement("div");
			s = h.style; s.position="absolute"; s.top="8px"; s.left="8px"; s.width="8px"; s.borderTop="1px dotted";
		this.element.appendChild(v);
		this.element.appendChild(h);
		
		var subs = this.element.getElementsByTagName("ul");
		if(subs.length) {
			var thisRef = this;
			this.element.className += " tree-menu-node-branch";
			this.element.addEventListener("click", this.clickHandler=function(evt){thisRef.onClick(evt);}, false);
			
			//create plus-minus icon:
			this.collapser = document.createElement("div");
				s = this.collapser.style; s.position="absolute"; s.top="4px"; s.left="2px";
				this.collapser.className="tree-menu-collapser";
				this.collapser.appendChild(document.createTextNode(""));
			this.element.appendChild(this.collapser);
	
			var expand = false;
			if(typeof Cookie == "function") {
				var nodes = new Cookie("treeMenuOpenNodes").getValue();
				if(typeof nodes == "object") {
					var id = this.element.getAttribute("id");
					for(i in nodes) if(nodes[i]==id) expand = true;
				}
			}
			if(expand) this.expand();
			else this.collapse();
		}
		else {
			this.element.className += " tree-menu-node-leaf";
		}
		
		//create icon from list-style-image:
		var lsImg = window.getComputedStyle(this.element,null).getPropertyValue("list-style-image");
		this.element.style.listStyleImage = "none";
		if(lsImg.indexOf("url(") == 0) {
			this.icon = document.createElement("img");
			this.icon.src = lsImg.replace(/^url\("?([^"]*)"?\)$/,"$1");
			this.element.insertBefore(this.icon, this.element.firstChild);
		}

	},
	
	onClick : function(evt) {
		//check that it's not a submenu that got clicked:
		var it = evt.currentTarget;
		var tmp = evt.target;
		while(tmp.nodeName.toLowerCase() != "ul" && tmp != evt.currentTarget) tmp=tmp.parentNode;
		if(tmp != it) return;

		if(this.collapsed) this.expand();
		else this.collapse();
	},
	
	expand : function() {
		var i, c;
		this.collapsed = false;
		
		//show children:
		var kids = this.element.childNodes;
			for(i=0; i<kids.length; i++) if(kids[i].nodeType==1 && kids[i].tagName.toLowerCase()=="ul") kids[i].style.display="";
		
		//change icon:
		c = this.collapser;
			c.firstChild.nodeValue = "-"; 
			c.title = "Collapse"; 
			c.className = c.className.replace(/\bcollapsed\b/,"");
		
		//persist state:
		var id = this.element.getAttribute("id");
		if(id && typeof Cookie == "function") {
			var cookie = new Cookie("treeMenuOpenNodes");
			var oldNodes = cookie.getValue();
			var newNodes = [];
			if(typeof oldNodes == "object" && oldNodes.constructor == Array) {
				for(i in oldNodes) if(oldNodes[i] != id) newNodes[newNodes.length] = oldNodes[i];
				newNodes[newNodes.length] = id;
			}
			cookie.setValue(newNodes);
			cookie.setLifespan(60*60*24*365);
		}
	},
	
	collapse : function() {
		var i;
		this.collapsed = true;
		
		//hide children:
		var kids = this.element.childNodes;
			for(i=0; i<kids.length; i++) if(kids[i].nodeType==1 && kids[i].tagName.toLowerCase()=="ul") kids[i].style.display="none";
		
		//change icon:
		var c = this.collapser;
			c.firstChild.nodeValue = "+"; 
			c.title = "Expand"; 
			c.className += " collapsed";
			
		//persist state:
		var id = this.element.getAttribute("id");
		if(id && typeof Cookie == "function") {
			var cookie = new Cookie("treeMenuOpenNodes");
			var oldNodes = cookie.getValue();
			var newNodes = [];
			if(typeof oldNodes == "object" && oldNodes.constructor == Array) {
				for(i in oldNodes) if(oldNodes[i] != id) newNodes[newNodes.length] = oldNodes[i];
			}
			cookie.setValue(newNodes);
			cookie.setLifespan(60*60*24*365);
		}
	},
	
	destroy : function() {
		var elt = this.element;
		elt.className = elt.className.replace(/\btree-menu-node-(branch|leaf)\b/g, "");
		var s = elt.style;
			s.position = s.display = s.listStyleType = s.listStyleImage = "";
		var uls = this.element.getElementsByTagName("ul");
			for(var i=0; i<uls.length; i++) uls[i].style.display="";
		elt.removeChild(this.outlineVert);
		elt.removeChild(this.outlineHoriz);
		if(this.collapser) elt.removeChild(this.collapser);
		if(this.icon) elt.removeChild(this.icon);
		elt.removeEventListener("click", this.clickHandler, false);
	}
}
