
/*

TODO:
	* Make keyboard-navigable (insert <a>s around branch labels)
	* Don't construct collapser/outline elements on a node until that node is shown, to improve performance in large lists

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
		var open = {};
		if(typeof Cookie == "function") {
			var nodes = new Cookie("treeMenuOpenNodes").getValue();
			if(nodes && typeof nodes == "object" && nodes.constructor == Array) {
				for(i in nodes) open[nodes[i]] = 1; //store in hash for quick access
			}
		}
		for(i=0; (li=this.element.getElementsByTagName("li")[i]); i++) {
			this.menuNodes[this.menuNodes.length] = new TreeMenuNode(li, open[li.id]);
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
		if(uls[i].className.match(/\bnavigation\b/)) new TreeMenu(uls[i]);
	}
};
TreeMenu.disableScriptSheet = function() {
	var i, menu;
	for(i=0; (menu=TreeMenu.instances[i]); i++) {
		menu.destroy();
	}
	TreeMenu.instances = [];
};



function TreeMenuNode(elt, open) {
	this.element = elt;
	this.defaultOpen = open;
	this.create();
}
TreeMenuNode.prototype = {
	create : function() {
		var v, h, i, j;
		var elt = this.element;		

		//create dotted lines:
		v = this.outlineVert = document.createElement("span");
			v.className = "tree-menu-outline-vertical";
			var isLast=true; var e=elt; while(e=e.nextSibling) if(e.nodeType==1) {isLast=false; break;} //is it the last node?
			if(isLast) v.className += " last-child-outline";
			else if(v.style.setExpression) v.style.setExpression("height","this.parentNode.offsetHeight"); //hack to make IE set height to 100% of <li>
		h = this.outlineHoriz = document.createElement("span");
			h.className = "tree-menu-outline-horizontal";
		elt.insertBefore(v, elt.firstChild);
		elt.insertBefore(h, elt.firstChild);
		
		var subs = elt.getElementsByTagName("ul");
		if(subs.length) {
			var thisRef = this;
			elt.className += " tree-menu-node-branch";
			elt.addEventListener("click", this.clickHandler=function(evt){thisRef.onClick(evt);}, false);

			//create plus-minus icon:
			this.collapser = document.createElement("span");
				this.collapser.className="tree-menu-collapser";
				this.collapser.appendChild(document.createTextNode(""));
			elt.insertBefore(this.collapser, elt.firstChild);

			if(this.defaultOpen) this.expand();
			else this.collapse();
		} else {
			elt.className += " tree-menu-node-leaf";
		}

		//create icon from list-style-image:
		var lsImg = window.getComputedStyle(elt,null).getPropertyValue("list-style-image");
		if(lsImg.indexOf("url(") == 0) {
			this.icon = document.createElement("img");
			this.icon.src = lsImg.replace(/^url\("?([^"]*)"?\)$/,"$1");
			elt.insertBefore(this.icon, elt.firstChild);
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
		var i, c;
		this.collapsed = true;
		
		//hide children:
		var kids = this.element.childNodes;
			for(i=0; i<kids.length; i++) if(kids[i].nodeType==1 && kids[i].tagName.toLowerCase()=="ul") kids[i].style.display="none";

		//change icon:
		c = this.collapser;
		c.firstChild.nodeValue = "+"; 
		c.title = "Expand"; 
		c.className += " collapsed";

		//persist state:
		var id = this.element.getAttribute("id");
		if(id && typeof Cookie == "function") {
			c = new Cookie("treeMenuOpenNodes");
			var oldNodes = c.getValue();
			var newNodes = [];
			if(typeof oldNodes == "object" && oldNodes.constructor == Array) {
				for(i in oldNodes) if(oldNodes[i] != id) newNodes[newNodes.length] = oldNodes[i];
			}
			c.setValue(newNodes);
			c.setLifespan(60*60*24*365);
		}
	},
	
	destroy : function() {
		var elt = this.element;
		elt.className = elt.className.replace(/\btree-menu-node-(branch|leaf)\b/g, "");
		var uls = this.element.getElementsByTagName("ul");
			for(var i=0; i<uls.length; i++) uls[i].style.display="";
		elt.removeChild(this.outlineVert);
		elt.removeChild(this.outlineHoriz);
		if(this.collapser) elt.removeChild(this.collapser);
		if(this.icon) elt.removeChild(this.icon);
		elt.removeEventListener("click", this.clickHandler, false);
	}
}
