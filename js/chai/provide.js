chai = {}
chai.provide = function(namespace) {
	var nsl = namespace.split('.');
	var l = nsl.length;
	var parent = window;
	for(var i=0; i<l; i++) {
		var n = nsl[i];
		if(!parent[n]) {
			parent[n] = {}
		}
		parent = parent[n];
	}
}