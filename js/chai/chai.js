
/*
Misc views
*/


(function($) {
	$.notify = function(txt, type) {
		if(!$.notify_cnt) $.notify_cnt = 0;
		$.notify_cnt++;
		if(!type) type='warning';

		// move up
		$('.notification').each(function(idx, ele) {
			var bottom = parseInt($(ele).css('bottom'));
			$(ele).css('bottom', (bottom + $(ele).height() + 24) + 'px')
		})

		$('body').append('<div id="notify'+$.notify_cnt
				+'" class="alert-message notification '+type
				+'"><a href="#" class="close">×</a><span style="margin-right: 7px">'
				+txt+'</span></div>');
		$n = $('body').find('div.notification:last');
		$n.find('.close').click(function() {
			$(this).parent().remove();
			return false;
		});
		// clear after 5sec
		setTimeout('$("#notify'+$.notify_cnt+'").fadeOut()', 5000);
		return $n;
	};

	// show a message
	$.msgprint = function(txt) {
		$.require('lib/js/bootstrap/bootstrap-modal.js');
		if(!$('#app_msgprint').length) {
			$('body').append('<div id="app_msgprint" class="modal hide">\
			<div class="modal-header">\
				<a href="#" class="close">&times;</a>\
				<h3>Message</h3>\
				</div>\
			<div class="modal-body"></div>\
			<div class="modal-footer">\
				<button class="btn primary">Close</button>\
			</div>\
			</div>');
			$('#app_msgprint button.primary').click(function() {
				$('#app_msgprint .modal-body').empty();
				$('#app_msgprint').modal('hide');
			});
			$('#app_msgprint .close').click(function() {
				$('#app_msgprint button.primary').click();
			});		
		}
		$('#app_msgprint .modal-body').append('<p>'+txt+'</p>');
		$('#app_msgprint').modal({backdrop:'static', show: true});

	};

	$.confirm = function(txt, yes, no) {
		$.require('lib/js/bootstrap/bootstrap-modal.js');
		if(!$('#app_confirm').length) {
			$('body').append('<div id="app_confirm" class="modal hide">\
			<div class="modal-header">\
				<a href="#" class="close">&times;</a>\
				<h3>Message</h3>\
				</div>\
			<div class="modal-body"></div>\
			<div class="modal-footer">\
				<button class="btn secondary">No</button>\
				<button class="btn primary">Yes</button>\
			</div>\
			</div>');
			$('#app_confirm button.primary').click(function() {
				$('#app_confirm').modal('hide');
				if(yes)yes();
			});
			$('#app_confirm button.secondary').click(function() {
				$('#app_confirm').modal('hide');
				if(no)no();
			});
			$('#app_confirm .close').click(function() {
				$('#app_confirm').modal('hide');
				if(no)no();
			});
		}
		$('#app_confirm .modal-body').html('<p>'+txt+'</p>');
		$('#app_confirm').modal({backdrop: 'static', show: true});
	};	
})(jQuery);
/*

Utility
-------

$.rep("string with %(args)s", obj) // replace with values
$.set_style(<css code>)
$.set_script(<js code>)
$.random(n)
$.set_default(obj, key, value)
$.is_email(txt)
$('selector').classList() - get class list of the object


Server Call
-----------

Call server method. Wrapper to $.ajax
Will automatically print "log", "error" and "traceback" in console.

Usage:

$.call({
	type: [optional | "GET" default],
	method: <string: server method like "lib.chai.objstore.get"
	data: <dict: arguments>,
	success: <function: on success parameter data, see $.ajax>
	
})

*/

(function($) {
	// python style string replace
	$.index = 'index';
	$.rep = function(s, dict) {
		for(key in dict) {
		    var re = new RegExp("%\\("+ key +"\\)s", "g");
			s = s.replace(re, dict[key]);
		}
	    return s;
	}
	// import css / js files
	$.set_css = function(css) {
		$('head').append('<style type="text/css">'+css+'</style>')
	};
	$.set_js = function(js) {
		$('head').append('<script language="javascript">'+js+'</script>');
	};
	$.random = function(n) {
		return Math.ceil(Math.random()*n)-1;
	};
	$.set_default = function(d, k, v) {
		if(!d[k])d[k]=v;
	};
	$.is_email = function(txt) {
		return txt.search("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")!=-1;
	};
	$.fn.classList = function() {
		return this.attr('class').split(/\s+/);
	}
	$.get_gravatar = function(email) {
		return ''
		// get gravatar
		$.require('lib/js/md5.js');
		return '<img src="http://www.gravatar.com/avatar/'
			+ hex_md5(email)
			+'?s=28" class="gravatar"/>'
		
	};
	$.call = function(opts) {
		$.set_default(opts, 'type', 'GET')
		$.set_default(opts, 'data', {})
		
		opts.data._method = opts.method;
		$.ajax({
			url:'',
			type: opts.type || 'GET',
			data: opts.data,
			dataType: 'json',
			success: function(data) {
				if(data.error) console.log('Error:' + data.error);
				if(data.traceback) console.log('Traceback:' + data.traceback);
				if(data.log) { console.log('Log:' + data.log); }
				opts.success && opts.success(data);
			}
		});
	}
})(jQuery);
/*

Require
-------
Load js/css files (sub-modules). Inspired by http://plugins.jquery.com/project/require

Usage:

$.require("path/to/library")

LocalStorage:
- This method tries to save modules once loaded to localStorage. 
- The versioning is maintained using `app.version` global property.
- If app.version is different from localStorage._version OR app.version = -1,
  then the localStorage will be cleared on load



*/

(function($) {
	$.require = function(file, params) {
		var extn = file.split('.').slice(-1);
		if(!params) params = {};
		
		// get from localstorage if exists
		if(localStorage && localStorage[file]) {
			extn == 'js' && $.set_js(localStorage[file]) || $.set_css(localStorage[file]);
			$._require_loaded[file] = true;
			return $;
		}
		
		if (!$._require_loaded[file]) {
			$('.notification').remove();
			var $n = $.notify('Loading...');
			xhr = $.ajax({
				type: "GET",
				url: file,
				data: {v:$.random(100)},
				success: params.callback || null,
				dataType: extn=="js" ? "script" : "text",
				cache: params.cache===false?false:true,
				async: false
			});
			$n && $n.remove();
			$._require_loaded[file] = true;
			
			// js loaded automatically
			if(extn=="css") {
				$.set_css(xhr.responseText);
			}
			
			// add to localStorage
			if(localStorage) localStorage[file] = xhr.responseText;
		}
		return $;
	};
	$._require_loaded = {};
})(jQuery);
/*

Inheritence "Class"
-------------------
see: http://ejohn.org/blog/simple-javascript-inheritance/
To subclass, use:

	var MyClass = Class.extend({
		init: function
	})

*/

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype

(function(){
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
	// The base Class implementation (does nothing)
	this.Class = function(){};
	
	// Create a new Class that inherits from this class
	Class.extend = function(prop) {
		var _super = this.prototype;
		
		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;
		
		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] = typeof prop[name] == "function" && 
				typeof _super[name] == "function" && fnTest.test(prop[name]) ?
				(function(name, fn){
					return function() {
						var tmp = this._super;
						
						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];
						
						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						var ret = fn.apply(this, arguments);				
						this._super = tmp;
						
						return ret;
					};
				})(name, prop[name]) :
				prop[name];
		}
		
		// The dummy class constructor
		function Class() {
			// All construction is actually done in the init method
			if ( !initializing && this.init )
				this.init.apply(this, arguments);
		}
		
		// Populate our constructed prototype object
		Class.prototype = prototype;
		
		// Enforce the constructor to be what we expect
		Class.prototype.constructor = Class;

		// And make this class extendable
		Class.extend = arguments.callee;
		
		return Class;
	};
})();

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

/*
Application
-----------

app.register() - open register modal
app.login() - fires login modal
app.logout()
app.editprofile() - edit profile view

Setup/internal methods:

These are called at startup $(document).ready

app.load_session() - load session info
app.setup_localstorage() - clear localstorage if version is changed or -1
app.delegate_hardlinks() - create a delegate on click events on link <a> objects
app.open_default_page() - open default page on load / fire necessary events

*/

// app namespace for app globals
var app = {	
	// module views
	login: function() {
		$.require('lib/views/user/login.js');
		if(!app.loginview)
			app.loginview = new LoginView();
		app.loginview.show();
	},
	logout: function() {
		$.call({
			method:'lib.chai.session.logout',
			type:'POST', 
			success: function(data) {
				$.session = {"user":"guest" ,"userobj":{}}
				$(document).trigger('logout');
			}
		});
	},
	register: function() {
		$.require('lib/views/user/register.js');
		if(!app.registerview)
			app.registerview = new RegisterView();
		app.registerview.show();		
	},
	editprofile: function() {
		$.require('lib/views/user/editprofile.js');
		if(!app.editprofileview)
			app.editprofileview = new EditProfileView();
		app.editprofileview.show();
	},
	setup_localstorage: function() {
		if(localStorage) {
			if(app.version==-1) 
				localStorage.clear();
			if(localStorage._version && localStorage._version != app.version) {
				localStorage.clear();
			}
		} 
		localStorage._version = app.version;		
	},
	delegate_hardlinks: function() {
		// hardlinks to softlinks
		$("body").delegate("a", "click", function() {
			var href = $(this).attr('href');
			if(href && 
				href.substr(0,1)!='#' &&
				href.substr(0,6)=='pages/' &&
				href.indexOf('.html')!=-1) {
					location.href = '#' + href.substr(6, href.length-11);
					return false;
			}
			return true;
		});		
	},
	// open default page
	open_default_page: function() {
		$content = $('#main .content-wrap.active');
		if(location.hash && location.hash != '#') {
			// remove the current content - may overlap
			$content.remove();
			$(window).trigger('hashchange');
		} else {
			if($content.length) {
				var cid = $content.attr('id');
				if(app.views[cid]) {
					// loading a view by default
					$content.remove();
					chai.view.open(cid);
				} else {
					// active content is already loaded, 
					// (for static content)
					$content.trigger('_show');					
				}
			} else {
				// no location, open index
				chai.view.open($.index);
			}
		}
	},
	load_session: function() {
		$.call({
			method:'lib.chai.session.load', 
			success:function(session) {
				$.session = session
				// trigger login
				$(document).trigger('login');
			}
		})		
	},
	setup_cms: function() {
		
	}
};

// STARTUP!
$(document).ready(function() {	
	// clear localStorage if version changed
	app.setup_localstorage();		

	// load session
	app.load_session();

	// delete hardliks to softlinks
	app.delegate_hardlinks();

	// open default page
	app.open_default_page();
	
	// setup cms settings
	app.setup_cms();
});
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
				callback();
			}
		});
	},
	make_page: function(obj) {
		$.require('lib/views/ui/page.js');
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

app.views = {
	'notfound': {path: 'lib/views/notfound.html'},
	
	// cms
	'editpage': {path: 'lib/views/cms/editpage.html'},
	'pagelist': {path: 'lib/views/cms/pagelist.html'},
	'filelist': {path: 'lib/views/cms/filelist.html'},
	'cms_settings': {path: 'lib/views/cms/settings.html'},
	
	// user
	'register': {path: 'lib/views/user/register.js'},
	'userlist': {path: 'lib/views/user/userlist.html'},
	'reset_password': {path: 'lib/views/user/reset_password.html'},
	'reset_password_done': {path: 'lib/views/user/reset_password_done.html'},
	'forgot_password': {path: 'lib/views/user/forgot_password.html'},
	'forgot_password_done': {path: 'lib/views/user/forgot_password_done.html'}
}

var TopBar = Class.extend({
	init: function() {
		$('header').append('<div class="topbar">\
			<div class="topbar-inner">\
				<div class="container">\
					<a class="brand" href="#index">[Title]</a>\
					<ul class="nav">\
					</ul>\
					<ul class="nav secondary-nav">\
					</ul>\
				</div>\
			</div>\
		</div>');
		this.make();
		this.bind_events();
		$('.topbar').dropdown();	
	},
	
	bind_events: function() {
		var me = this;
		// make toolbar on login
		$(document).bind('login', function() {
			me.make();
		});

		$(document).bind('logout', function() {
			me.make();
		});		
	},
	
	make: function() {
		var user = ($.session && $.session.user) || 'guest';

		// clear out if there is anything
		$('.topbar .nav.secondary-nav').empty();

		// render admin
		if(!user || user=='guest') {
			this.make_login();
		}

		// if not guest and admin
		if(user && user!='guest') {
			this.make_admin();
			this.make_profile();
		}
	},
	
	make_login: function() {
		$('.topbar .nav.secondary-nav').append('\
			<li><a href="javascript:app.login()">Login</a></li>\
		');
	},
	
	make_admin: function() {
		// edit links for admins
		if(app.cms) {
			$('.topbar .nav.secondary-nav').append('\
				<li class="dropdown">\
					<a class="dropdown-toggle" href="#">Admin</a>\
					<ul class="dropdown-menu">\
						<li><a href="#cms_settings">Settings</a></li>\
						<li><a href="#pagelist">Pages</a></li>\
						<li><a href="#filelist">Files</a></li>\
						<li><a href="#userlist">Users</a></li>\
					</ul>\
				<li>');
		}
	},
	
	make_content: function() {
		if(app.cms) {
			if(!$('.topbar .nav [href="#toc"]').length)
				$('.topbar .nav:first').append('<li><a href="#toc">Contents</a></li>')
		}
	},
	
	make_profile: function() {
		// user profile and logout
		var img = '';
		if($.session.userobj.email) {
			var img = $.get_gravatar($.session.userobj.email);
		}
		$('.topbar .nav.secondary-nav').append('\
			<li class="dropdown">' +
				'<a class="dropdown-toggle" href="#">'
					+ ($.session.userobj.fullname || $.session.user)+'</a>\
				<ul class="dropdown-menu">\
					<li><a href="javascript:app.editprofile()">Edit Profile</a></li>\
					<li><a href="javascript:app.logout()" id="topbar_logout">Logout</a></li>\
				</ul>\
			<li>' + img);

		// logout
		$('#topbar_logout').click($.logout);
	}	
});


// activate dropdown events
$(document).ready(function() {
	$.require('lib/js/bootstrap/bootstrap-dropdown.js');
	app.topbar = new TopBar();

	// set brand
	if(app.cms_settings.brand)
		$('.topbar .brand').html(app.cms_settings.brand);
})


