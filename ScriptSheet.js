
/*

This class provides a way to switch between 
"script sheets" much like switching between 
CSS style sheets. The preferred style choice
is persisted in a cookie.

Example:
<link rel="scriptsheet" type="text/javascript" href="OSXBar" title="Mac OS X Style" />
<link rel="alternate scriptsheet" type="text/javascript" href="MenuBar" title="Windows Style" />

*/



function ScriptSheet(title, script) {
	this.title = title;
	this.script = window[script];
	ScriptSheet.instances[ScriptSheet.instances.length] = this;
}
ScriptSheet.prototype = {
	enable : function() {
		if(this.script && this.script.enableScriptSheet) this.script.enableScriptSheet();
	},
	disable : function() {
		if(this.script && this.script.disableScriptSheet) this.script.disableScriptSheet();
	}
};
ScriptSheet.instances = [];
ScriptSheet.getPreferredStyle = function() {
	var i, lnk, rel, ttl;
	var lnks = document.getElementsByTagName("link");
	
	//look for cookie first:
	if(typeof Cookie == "function") {
		ttl = new Cookie("preferredStyle").getValue();
		if(ttl) { //make sure the cookie value is an actual sheet title:
			for(i=0; i<lnks.length; i++) if(lnks[i].getAttribute("title") == ttl) return ttl;
		}
	}
	
	//else get first titled sheet:
	for(i=0; i<lnks.length; i++) {
		rel = lnks[i].getAttribute("rel");
		ttl = lnks[i].getAttribute("title");
		if(rel.match(/^\s*(style|script)sheet\s*$/i) && ttl) return ttl;
	}
	return null;
};
ScriptSheet.switchTo = function(title) {
	var i, lnk, rel, ttl, hrf, match;
	var scripts = [];
	for(i=0; (lnk=document.getElementsByTagName("link")[i]); i++) {
		rel = lnk.getAttribute("rel");
		ttl = lnk.getAttribute("title");
		hrf = lnk.getAttribute("href");
		if(rel && (match=rel.match(/^\s*((alternate)\s+)?(script|style)sheet\s*$/i)) && hrf) {
			if(match[3]=="style") { //handle stylesheets:
				lnk.disabled = !(ttl == title || !ttl);
			} else {
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
	if(typeof Cookie == "function") {
		var cook = new Cookie("preferredStyle");
		cook.setLifespan(60*60*24*365); //1 year
		cook.setValue(title);
	}
};
ScriptSheet.onLoad = function() {
	var pref = ScriptSheet.getPreferredStyle();
	ScriptSheet.switchTo(pref);
}

window.addEventListener("load",ScriptSheet.onLoad,false);
