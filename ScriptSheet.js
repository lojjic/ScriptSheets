/*
**  ScriptSheet script by Jason Johnston (jj@lojjic.net)
**  Created July 2003.  Use freely, but give me credit.
**
**  This class provides a way to switch between 
**  "script sheets" much like switching between 
**  CSS style sheets. The preferred style choice
**  is persisted. For usage and details see 
**  ScriptSheet-doc.html.
*/

function ScriptSheet(title, script) {
	this.title = title;
	this.script = window[script];
	var i = ScriptSheet.instances;
	i[i.length] = this;
}
ScriptSheet.prototype = {
	enable : function() {
		this.disable();
		var s = this.script;
		if(!s) return;
		if(!s.enableScriptSheet) s.enableScriptSheet = ScriptSheet.enableScriptSheetDefault;
		s.enableScriptSheet();
	},
	disable : function() {
		var s = this.script;
		if(!s) return;
		var inst = this.scriptSheetInstances;
		if(!s.disableScriptSheet) s.disableScriptSheet = ScriptSheet.disableScriptSheetDefault;
		s.disableScriptSheet();
	}
};
ScriptSheet.enableScriptSheetDefault = function() {
	this.disableScriptSheet();
	var sel = this.scriptSheetSelector;
	if(!sel) return;
	var elts;
	if(typeof sel == "function") elts = sel();
	if(typeof sel == "string") elts = ScriptSheet.matchSelector(sel);
	var inst = this.scriptSheetInstances;
	for(var i=0; i<elts.length; i++) inst[inst.length] = new this(elts[i]);
};
ScriptSheet.disableScriptSheetDefault = function() {
	var inst = this.scriptSheetInstances || [];
	for(var i in inst) if(inst[i].destroy) inst[i].destroy();
	this.scriptSheetInstances = [];
};
ScriptSheet.instances = [];
ScriptSheet.getPreferredStyle = function() {
	var i, lnk, rel, ttl;
	var lnks = document.getElementsByTagName("link");
	//look for cookie first:
	if(window.Cookie) {
		ttl = new Cookie("preferredStyle").getValue();
		if(ttl=="[basic]" || ttl=="[null]") return ttl;
		if(ttl) { //make sure cookie value is an actual sheet title:
			for(i=0; (lnk=lnks[i]); i++) if(lnk.getAttribute("title") == ttl) return ttl; 
		}
	}
	//else get first titled sheet:
	for(i=0; (lnk=lnks[i]); i++) {
		rel = lnk.getAttribute("rel");
		ttl = lnk.getAttribute("title");
		if(rel.match(/\b(style|script)sheet\b/i) && ttl) return ttl;
	}
	return null;
};

// Take a CSS selector string and return all matching elements:
ScriptSheet.matchSelector = function(sel) {
	var i, j, a, b; //temps
	
	//TODO: escape quoted strings so they aren't modified
	sel = (
		(sel.charAt(0)!="#" ? " " : "") + //initial descendant selector unless starts with #id
		sel.replace(/\s+/g, " ") //collapse whitespaces to a single space
		.replace(/\s*,\s*/g, ", ") //single space after commas
		.replace(/\s*([>\+=])\s*/g, "$1") //strip extra whitespace around combinators 
		.replace(/^\s*(\S*)\s*$/, "$1") //and at start and end of string
		+ ",") //add comma on end to mark end of selector
		.replace(/([ >\+])([\.\[#])/g, "$1*$2"); //insert universal selector where it is optionally omitted
	
	//Split string into array of significant parts:
	//var parts = sel.split(/([#\. >\+,]|\[[^\]]*\])/); //Fails in IE
	var parts = [];
	while(sel.length > 0) {
		switch(sel.charAt(0)) {
		case "#": case ".": case " ": case ">": case "+": case ",":
			parts[parts.length] = sel.charAt(0);
			sel = sel.substring(1);
		break;
		case "[":
			i = sel.indexOf("]")+1;
			parts[parts.length] = sel.substring(0,i);
			sel = sel.substring(i);
		break;
		default:
			a = sel.match(/^([^#\. >\+\[,]+)(.*)$/);
			parts[parts.length] = a[1];
			sel = a[2];
		}
	}
	
	var allElts = [];
	var elts = [document];
	
	for(var p=0; p<parts.length; p++) {
		a = []; //temp elt list
		switch(parts[p].charAt(0)) {
		case "": break; //ignore blank remnants of split
		case ",": //feed matches onto full list
			for(i in elts) allElts[allElts.length] = elts[i];
			a = [document]; //reset
		break;
		case "#":
			p++;
			if(elts[0]==document) { //if no previous context, do it fast:
				b = document.getElementById(parts[p]);
				a = b ? [b] : [];
			} 
			else for(i=0; i<elts.length; i++) if(elts[i].getAttribute("id") == parts[p]) a[a.length] = elts[i];
		break;
		case ".": //class
			p++;
			for(i=0; i<elts.length; i++) {
				b = elts[i].className || elts[i].getAttribute("class") || elts[i].getAttribute("className");
				if(b && b.match(parts[p])) //fast filter
					if(b.match(new RegExp("^(.*\\s+)?" + parts[p] + "(\\s+.*)?$"))) a[a.length] = elts[i];
			}
		break;
		case "[": //attribute
			b = parts[p].match(/^\[([^\]=]+)(=([^\]]*))?\]$/);
			if(!b) break;
			var attr = b[1]; var val = b[3];
			if(val) val=val.replace(/^(['"])([^\1]*)\1$/,"$2"); //remove quotes
			for(i=0; i<elts.length; i++) if((!val && elts[i].getAttribute(attr)) || (val && elts[i].getAttribute(attr) == val)) a[a.length] = elts[i];
		break;
		case " ": //descendant
			p++;
			for(i=0; i<elts.length; i++) {
				b = elts[i].getElementsByTagName(parts[p]);
				if(!b.length && elts[i]==document && document.all) b = document.all; //IE5 doesn't know d.gEBTN("*")
				for(j=0; j<b.length; j++) a[a.length] = b[j];
			}
		break;
		case ">": //child
			for(i=0; i<elts.length; i++) {
				b = elts[i].childNodes;
				for(j=0; j<b.length; j++) if(b[j].nodeType==1) a[a.length] = b[j];
			}
		break;
		case "+": //nextSibling
			for(i=0; i<elts.length; i++) {
				b = elts[i].nextSibling;
				while(b && b.nodeType != 1) b = b.nextSibling;
				if(b) a[a.length] = b;
			}
		break;
		default: //element:
			for(i=0; i<elts.length; i++) if(parts[p] == "*" || elts[i].nodeName.toLowerCase() == parts[p]) a[a.length] = elts[i];
		}
		elts = a; //commit temp list
	}
	return allElts;
};
ScriptSheet.switchTo = function(title) {
	var i, lnk, rel, ttl, hrf, match, c;
	var lnks = document.getElementsByTagName("link")
	var scripts = [];
	for(i=0; (lnk=lnks[i]); i++) {
		rel = lnk.getAttribute("rel");
		ttl = lnk.getAttribute("title");
		hrf = lnk.getAttribute("href");
		if(rel && (match=rel.match(/^\s*((alternat(e|ive))\s+)?(script|style)sheet\s*$/i)) && hrf) {
			if(match[4]=="style") lnk.disabled = !(ttl == title || (!ttl && title != "[null]")); //handle stylesheets
			else {
				hrf = hrf.substring(hrf.indexOf("#")+1);
				if(!lnk.scriptSheet) lnk.scriptSheet = new ScriptSheet(ttl, hrf);
				lnk.scriptSheet.disable();
				if(ttl == title || (!ttl && title != "[null]")) scripts[scripts.length] = lnk.scriptSheet; //add to list
			}
		}
	}
	//enable all matching scripts:
	for(i=0; i<scripts.length; i++) scripts[i].enable();
	//remember choice:
	if(window.Cookie) {
		c = new Cookie("preferredStyle");
		c.setLifespan(60*60*24*365);
		c.setValue(title || "");
	}
};
ScriptSheet.onLoad = function() {
	var pref = ScriptSheet.getPreferredStyle();
	ScriptSheet.switchTo(pref);
}
if(window.addEventListener) window.addEventListener("load",ScriptSheet.onLoad,false);



//Style Chooser UI widget: new StyleChooser().appendTo(elt); (or .insertBefore(elt))
function StyleChooser() {
	this.create();
	var i = StyleChooser.instances;
	i[i.length] = this;
}
StyleChooser.prototype = {
	create : function() {
		var sel, i, lnk, rel, ttl, opt;
		sel = this.chooser = document.createElement("select");
		var styles = {};
		for(i=0; (lnk=document.getElementsByTagName("link")[i]); i++) {
			rel = lnk.getAttribute("rel");
			ttl = lnk.getAttribute("title");
			if(rel && rel.match(/\b(script|style)sheet\b/i) && ttl) styles[ttl] = ttl;
		}
		styles["Basic Style"] = "[basic]"; //add basic style (only untitled sheets)
		styles["No Style"] = "[null]"; //add null style (no sheets)
		var pref = ScriptSheet.getPreferredStyle();
		for(i in styles) {
			opt = document.createElement("option");
			opt.appendChild(document.createTextNode(i));
			opt.setAttribute("value",styles[i]);
			if(styles[i]==pref) opt.selected=true;
			sel.appendChild(opt);
		}
		sel.addEventListener("change", function(evt){StyleChooser.switchTo(this.value);}, false);
	},
	appendTo : function(elt) {
		elt.appendChild(this.chooser);
	},
	insertBefore : function(node) {
		node.parentNode.insertBefore(this.chooser, node);
	}
};
StyleChooser.instances = [];
StyleChooser.switchTo = function(title) {
	var i, j, a, b;
	//update all StyleChoosers:
	for(i=0; (a=StyleChooser.instances[i]); i++)
		for(j=0; (b=a.chooser.options[j]); j++)
			if(b.value == title) a.chooser.selectedIndex = j;
	//switch the style:
	ScriptSheet.switchTo(title);
};
