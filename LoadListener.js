
// Fire handler(s) when an element loads into DOM, without having 
// to wait for entire document plus all assets to load.

/* Usage:
	
	var myLoader = new LoadListener(); //instantiate
	
	var eltById = myLoader.getElementById("theElement"); //add handler to element with Id
	    eltById.addHandler(handleLoadFunc1); // (can add multiple handlers)

	var eltByTN = myLoader.getElementsByTagName("a"); //add handler to all elements with same tagName
	    eltByTN.addHandler(handleLoadFunc2);

*/


function LoadListener() {
	if(!(this instanceof LoadListener)) return new LoadListener();

	LoadListener.instances[LoadListener.instances.length] = this; //add this instance to list
	LoadListener.checkIfLoaded(LoadListener.instances.length-1); //start checking for existence
}
LoadListener.prototype = {
	idObjects : [],
	tnObjects : [],
		
	getElementById : function(eltId) {
		for(var i=0; i<this.idObjects.length; i++) if(eltId == this.idObjects[i].id) return this.idObjects[i]; //disallow duplicate elts
		var obj = this.idObjects[this.idObjects.length] = {id:eltId, hasLoaded:false};
		obj.handlers = [];
		obj.addHandler = function(h) {
			for(var j=0; j<obj.handlers.length; j++) if(h == obj.handlers[j]) return; //disallow duplicate handlers
			obj.handlers[obj.handlers.length] = h;
		};
		return obj;
	},

	getElementsByTagName : function(tagName) {
		for(var i=0; i<this.tnObjects.length; i++) if(tagName == this.tnObjects[i].tagName) return this.tnObjects[i]; //disallow duplicate elts
		var obj = this.tnObjects[this.tnObjects.length] = {tagName:tagName, hasLoaded:0};
		obj.handlers = [];
		obj.addHandler = function(h) {
			for(var j=0; j<obj.handlers.length; j++) if(h == obj.handlers[j]) return; //disallow duplicate handlers
			obj.handlers[obj.handlers.length] = h;
		};
		return obj;
	}
};
LoadListener.instances = []; //holds list of instances of LoadListener objects
LoadListener.checkIfLoaded = function(instIdx) { //periodically check for existence of elts
	var inst = LoadListener.instances[instIdx];
	var i,j,k,obj,elt;
	
	for(i=0; i<inst.idObjects.length; i++) { //elements by Id
		obj = inst.idObjects[i];
		elt = document.getElementById(obj.id);
		if(!obj.hasLoaded && elt && (elt.nextSibling || elt.readyState=="complete")) {
			//obj.hasLoaded = true;
			for(j=0; j<obj.handlers.length; j++) {
				elt._tmpHandler = obj.handlers[j]; //make "this" refer to element
				elt._tmpHandler(); elt._tmpHandler = null;
			}
			//remove from list:
			for(j=i; inst.idObjects[j+1]; j++) inst.idObjects[j] = inst.idObjects[j+1];
			inst.idObjects.length--;
		}
	}

	for(i=0; i<inst.tnObjects.length; i++) { //elements by tagName
		obj = inst.tnObjects[i];
		var elts = document.getElementsByTagName(obj.tagName);
		for(j=obj.hasLoaded; j<elts.length; j++) { //start after ones we've already done
			var elt = elts[j];
			if(elt && (elt.nextSibling || elt.readyState=="complete")) {
				obj.hasLoaded = j; //keep track of how many we've done, so we don't re-process old ones next time
				for(k=0; k<obj.handlers.length; k++) {
					elt._tmpHandler = obj.handlers[k]; //make "this" refer to element
					elt._tmpHandler(); elt._tmpHandler = null;
				}
			}
		}
	}
	setTimeout("LoadListener.checkIfLoaded(" + instIdx + ");",50);
}