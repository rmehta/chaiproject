/*

Object Store (model persistence)
--------------------------------

Usage:

chai.objstore.insert(obj, <function: callback>)
chai.objstore.update(obj, <function: callback>)
chai.objstore.get(<type>, <name>, <function: callback>) - if not available locally, get from server

chai.objstore.data - double dict of all objects loaded in session via chai.objstore.get

*/

chai.objstore = {
	data: {},
	set: function(obj) {
		var d = chai.objstore.data;
		if(!d[obj.type])
			d[obj.type] = {}
		d[obj.type][obj.name] = obj;
	},
	get:function(type, name, success, error) {
		var d = chai.objstore.data;
		if(d[type] && d[type][name]) {
			success(d[type][name]);
		} else {
			$.call({
				method:"lib.chai.objstore.get", 
				data: {"type":type, "name":name}, 
				success: function(obj) {
					if(obj.error) {
						error(obj); 
						return;
					} else {
						chai.objstore.set(obj);
						success(obj);					
					}
				}
			});
		}
	},
	insert: function(obj, success) {
		chai.objstore.post(obj, success, 'insert');
	},
	update: function(obj, success) {
		chai.objstore.post(obj, success, 'update');
	},
	post: function(obj, success, insert_or_update) {
		$.call({
			type: 'POST',
			method: 'lib.chai.objstore.' + (insert_or_update || 'insert'),
			data: {obj: JSON.stringify(obj)},
			success: function(data) {
				if(data.message && data.message=='ok') {
					chai.objstore.set(obj);
				}
				success(data);
			}
		});	
	},
	clear: function(type, name) {
		var d = chai.objstore.data;
		if(d[type] && d[type][name])
			delete d[type][name];
	}
}
