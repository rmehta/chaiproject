/*
View Management
---------------

Manages opening of "Pages" via location.hash (url fragment). Pages can be changed by
changing location.hash or calling:

chai.view.open('page/param')
*/


chai.view = {
	pages: {},
	// sets location.hash
	open: function(route) {
		if(!route) return;
		if(route[0]!='#') route = '#' + route;
		window.location = route;
	},
	// shows view from location.hash
	show_location_hash: function() {
		var route = location.hash;
		if(route=='#') return;
		var viewid = chai.view.get_view_id(route);		

		// go to home if not "index"
		if(viewid=='index' && $.index!='index') {
			chai.view.open($.index);
			return;
		}
		if(route==chai.view.current_route) {
			// no change
			return;
		}
		chai.view.current_route = location.hash;
		
		var viewinfo = app.views[viewid] || {};
		chai.view.show(viewid, viewinfo.path);
	},	
	show: function(name, path) {
		chai.view.load(name, path, function() {
			// make page active
			if($("#main .content-wrap.active").length) {
				$("#main .content-wrap.active").removeClass('active');
			}
			$("#"+name).addClass('active').trigger('_show');
			window.scroll(0, 0);
		});
	},
	load: function(name, path, callback) {
		if(!$('#'+name).length) {
			if(path) 
				chai.view.load_files(name, path, callback);
			else
				chai.view.load_virtual(name, callback);
		}
		callback();
	},
	load_files: function(name, path, callback) {
		var extn = path.split('.').splice(-1)[0];
		if(extn=='js') {
			$.getScript(path, callback);
		} else {
			$.get(path, function(html) {
				chai.view.make_page({name:name, html:html});
				callback();
			});
		}
	},
	load_virtual: function(name, callback) {
		$.call({
			method: 'lib.chai.cms.page.content',
			data: {
				name: name,
			},
			success: function(data) {
				chai.view.make_page({name:name, html:data.html, virtual:true});

				// execute js / css
				if(data.js)$.set_js(data.js);
				if(data.css)$.set_css(data.css);

				callback();
			}
		});
	},
	make_page: function(obj) {
		$.require('lib/chaijs/ui/page.js');
		new PageView(obj);
	},

	// get view id from the given route
	// route may have sub-routes separated
	// by `/`
	// e.g. "editpage/mypage"
	get_view_id: function(txt) {
		if(txt[0]=='#') { txt = txt.substr(1); }
		if(txt[0]=='!') { txt = txt.substr(1); }
		txt = txt.split('/')[0];
		if(!txt) txt = $.index || 'index';
		return txt;		
	},
	
	is_same: function(name) {
		if(name[0]!='#') name = '#' + name;
		return name==location.hash;
	},
}

// shortcut
chai.open = chai.view.open;

// bind history change to open
$(window).bind('hashchange', function() {
	chai.view.show_location_hash(decodeURIComponent(location.hash));
});
