/*
**  Menus script by Jason Johnston (jj@lojjic.net)
**  Created November 2002.  Use freely, but give me credit.
**
**  Use this script to create accessible drop-down
**  or tree-like expandable menus from normal unordered 
**  lists (<ul>) with a special class.
*/


function styleDropdownMenu(it) {

	it.addEventListener("mouseover",function(evt) {
		styleDropdownMenu._mouseoverEvent = evt;
		this._hoverTimer = setTimeout("onDropdownMenuItemPoked(styleDropdownMenu._mouseoverEvent)",500);
	},false);
	it.addEventListener("mouseout",function(evt) {
		if(this._hoverTimer) clearTimeout(this._hoverTimer);
	},false);
			

}

function styleMenu(ul,menuType) {
	var items = ul.getElementsByTagName("li");
	for(var i=0; i<items.length; i++) {
		var it = items[i]
		var sub = it.getElementsByTagName("ul")[0];
		if(sub) {
			var pokeHndlr = (menuType=="dropdown") ? onDropdownMenuItemPoked : onMenuItemPoked;
			it.addEventListener("click",pokeHndlr,false);
			it.className += " menu-branch menu-branch-collapsed";
			it._menuItemCollapsed = true;
			
			//make keyboard-navigable:
			function getFirstTextNode(elt) {
				var kids = elt.childNodes;
				for(var k=0; k<kids.length; k++) {
					if(kids[k].nodeType==3 && kids[k].nodeValue.match(/[^\s]/)) return kids[k];
					else if(kids[k].nodeType==1) {
						var kidTxt = getFirstTextNode(kids[k]);
						if(kidTxt) return kidTxt;
					}
				}
				return elt.firstChild; //fallback
			}
			var txt = getFirstTextNode(it);
			
			if(!sub.id) sub.id = "menuLink" + parseInt(Math.random()*100000);
			var lnk = document.createElement("a");
			lnk.setAttribute("href","#"+sub.id);
			lnk.addEventListener("click",function(evt){
				evt.preventDefault(); evt.stopPropagation();
				
				//dispatch new click to parent (because IE doesn't bubble a click on a link):
				var ck = document.createEvent("MouseEvents");
				ck.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);
				this.parentNode.dispatchEvent(ck);
			},false);
			
			txt.parentNode.insertBefore(lnk,txt);
			lnk.appendChild(txt);
		}
	}
}

function onMenuItemPoked(evt) {
	var it = evt.currentTarget;
	
	//check that it's not a submenu that got clicked:
	var tmp = evt.target;
	while(tmp.nodeName.toLowerCase() != "ul" && tmp != evt.currentTarget) tmp=tmp.parentNode;
	if(tmp != it) return;
	
	//change collapsed state:
	if(it._menuItemCollapsed = !it._menuItemCollapsed) it.className += " menu-branch-collapsed";
	else it.className = it.className.replace(/menu-branch-collapsed/g,"");
}

function onDropdownMenuItemPoked(evt) {
	onMenuItemPoked(evt);
	
	var it = evt.target;
	while(it.nodeName.toLowerCase()!="li") it=it.parentNode;
	
	function collapse(li) {
		li.className += " menu-branch-collapsed";
		li._menuItemCollapsed = true;
	}
	
	var sibs = it.parentNode.childNodes;
	for(var s=0; s<sibs.length; s++) 
		if(sibs[s].nodeType==1 && sibs[s] != it) collapse(sibs[s]);
	var kids = it.getElementsByTagName("li");
	for(var k=0; k<kids.length; k++) 
		if(kids[k].className.match("menu-branch")) collapse(kids[k]);
	
}

function onMenusDocLoaded(evt) {
	var lists = document.getElementsByTagName("ul");
	for(var i=0; i<lists.length; i++) {
		if(lists[i].className.match("dropdown-menu")) styleMenu(lists[i],"dropdown");
		if(lists[i].className.match("tree-menu")) styleMenu(lists[i],"tree");
	}
}

if(window.addEventListener) window.addEventListener("load",onMenusDocLoaded,false);