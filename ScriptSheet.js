/*
**  ScriptSheet script by Jason Johnston (jj@lojjic.net)
**  Created July 2003.  Use freely, but give me credit.
**
**  This class provides a way to switch between 
**  "script sheets" much like switching between 
**  CSS style sheets. The preferred style choice
**  is persisted in a cookie.
*/

function ScriptSheet(title, script) {
	this.title = title;
	this.script = window[script];
	var i = ScriptSheet.instances;
	i[i.length] = this;
}
ScriptSheet.prototype = {
	enable : function() {
		var h; if(this.script && (h = this.script.enableScriptSheet)) h();
	},
	disable : function() {
		var h; if(this.script && (h = this.script.disableScriptSheet)) h();
	}
};
ScriptSheet.instances = [];
ScriptSheet.getPreferredStyle = function() {
	var i, lnk, rel, ttl;
	var lnks = document.getElementsByTagName("link");
	//look for cookie first:
	if(window.Cookie) {
		ttl = new Cookie("preferredStyle").getValue();
		if(ttl) { //make sure the cookie value is an actual sheet title:
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
ScriptSheet.switchTo = function(title) {
	var i, lnk, rel, ttl, hrf, match, c;
	var lnks = document.getElementsByTagName("link")
	var scripts = [];
	for(i=0; (lnk=lnks[i]); i++) {
		rel = lnk.getAttribute("rel");
		ttl = lnk.getAttribute("title");
		hrf = lnk.getAttribute("href");
		if(rel && (match=rel.match(/^\s*((alternat(e|ive))\s+)?(script|style)sheet\s*$/i)) && hrf) {
			if(match[4]=="style") lnk.disabled = !(ttl == title || !ttl); //handle stylesheets
			else {
				hrf = hrf.substring(hrf.indexOf("#")+1);
				if(!lnk.scriptSheet) lnk.scriptSheet = new ScriptSheet(ttl, hrf);
				lnk.scriptSheet.disable();
				if(ttl == title || !ttl) scripts[scripts.length] = lnk.scriptSheet; //add to list
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
window.addEventListener("load",ScriptSheet.onLoad,false);
