// core library for chaiproject framework
// created by @rushabh_mehta
// license: MIT
//


// utility functions
//
// Usage:
// $.rep("string with %(args)s", obj) // replace with values
// $.set_style(css)
// $.set_script(js)
// $.random(n)
// $.set_default(obj, key, value)
// $.is_email(txt)
// $('selector').classList() - get class list of the object

(function($) {
	// python style string replace
	$.index = null;
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
	$.call = function(opts) {
		if(!opts.type) opts.type = 'GET';
		if(!opts.data) opts.data = {};
		
		opts.data._method = opts.method;
		$.ajax({
			url:'server/',
			type: opts.type || 'GET',
			data: opts.data,
			dataType: 'json',
			success: function(data) {
				if(data.error) console.log('Error:' + data.error);
				if(data.traceback) console.log('Traceback:' + data.traceback);
				if(data.log) { console.log('Log:' + data.log); }
				opts.success(data);
			}
		});
	}
})(jQuery);

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

// $.require
// http://plugins.jquery.com/project/require
//
// Usage: $.require('path/to/js')
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
			xhr = $.ajax({
				type: "GET",
				url: file,
				data: {v:$.random(100)},
				success: params.callback || null,
				dataType: extn=="js" ? "script" : "text",
				cache: params.cache===false?false:true,
				async: false
			});
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


// object store wrapper
//
// Usage:
// $.objstore.get(type, name, callback)
// $.objstore.post(obj, callback)
$.objstore = {
	data: {},
	set: function(obj) {
		var d = $.objstore.data;
		if(!d[obj.type])
			d[obj.type] = {}
		d[obj.type][obj.name] = obj;
	},
	get:function(type, name, success, error) {
		var d = $.objstore.data;
		if(d[type] && d[type][name]) {
			success(d[type][name]);
		} else {
			$.call({
				method:"lib.py.objstore.get", 
				data: {"type":type, "name":name}, 
				success: function(obj) {
					if(obj.error) {
						error(obj); 
						return;
					} else {
						$.objstore.set(obj);
						success(obj);					
					}
				}
			});
		}
	},
	insert: function(obj, success) {
		$.objstore.post(obj, success, 'insert');
	},
	update: function(obj, success) {
		$.objstore.post(obj, success, 'update');
	},
	post: function(obj, success, insert_or_update) {
		$.call({
			type: 'POST',
			method: 'lib.py.objstore.' + (insert_or_update || 'insert'),
			data: {obj: JSON.stringify(obj)},
			success: function(response) {
				if(response._log) {
					console.log(response._log);
				}
				success(response);
			}
		});		
	},
	clear: function(type, name) {
		if(d[type] && d[type][name])
			delete d[type][name];
	}
}


// view
// called internally 
// when the hash url is changed
//
// Usage:
// $.view.open(route)
$.view = {
	pages: {},
	load: function(name, path, callback) {
		if(!$('#'+name).length) {
			if(path) 
				$.view.load_files(name, path, callback);
			else
				$.view.load_object(name, callback);
		}
		callback();
	},
	load_files: function(name, path, callback) {
		var extn = path.split('.').splice(-1)[0];
		if(extn=='js') {
			$.getScript(path, callback);
		} else {
			$.get(path, function(html) {
				$.view.make_page(name, html);
				callback();
			});
		}
	},
	make_modal: function(name, html) {
		$(document.body).append(html);
		$('#'+name).bind('hidden', function() {
			window.history.back();
		})
	},
	make_page: function(name, html, js, css) {
		$('<div>')
			.addClass('content')
			.attr('id', name)
			.appendTo('.main.container')
			.html(html);
			
		if(js) $.set_script(js);
		if(css) $.set_style(css);
		
		$("#"+name).trigger('_make');		
	},
	load_object: function(name, callback) {
		$.objstore.get("page", name, 
			function(obj) {
				$.view.make(obj.name, obj.html, obj.js, obj.css);
				callback();
			}
		);
	},
	show: function(name, path) {
		$.view.load(name, path, function() {
			// make page active
			if($("#"+name).length) {
				if($(".main.container .content#" + name).length) {
					$(".main.container .content.active").removeClass('active');
					$("#"+name).addClass('active');					
				}
			}
			$("#"+name).trigger('_show');
			window.scroll(0, 0);
		});
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
	
	// shows view from location.hash
	show_location_hash: function() {
		var route = location.hash;
		if(route==$.view.current_route) {
			// no change
			return;
		}
		$.view.current_route = location.hash;
		
		var viewid = $.view.get_view_id(route);		
		var viewinfo = $._views[viewid] || {};
		$.view.show(viewid, viewinfo.path);
	},
	
	// sets location.hash
	open: function(route) {
		if(route[0]!='#') route = '#' + route;
		window.location = route;
	}
}

// bind history change to open
$(window).bind('hashchange', function() {
	$.view.show_location_hash(decodeURIComponent(location.hash));
});

// logout
// logs out user and reload the page
//
// Usage:
// $.logout();
//    triggers $(document)->logout event
(function($) {
	$.logout = function() {
		$.call({
			method:'lib.py.session.logout',
			type:'POST', 
			success: function(data) {
				$.session = {"user":"guest" ,"userobj":{}}
				$(document).trigger('logout');
			}
		});
		return false;
	}
})(jQuery);

// login
// loads session from server
// and calls $(document)->'login' event
//
$.call({
	method:'lib.py.session.load', 
	success:function(session) {
		$.session = session
		// trigger login
		$(document).trigger('login');
	}
})


// setup pages
// 1. load session
// 2. open default page
// 3. convert hardlinks to softlinks: 
//    eg. file.html becomes #files
$(document).ready(function() {	
	// clear localStorage if version changed
	if(localStorage) {
		if(app.version==-1) 
			localStorage.clear();
		if(localStorage._version && localStorage._version != app.version) {
			localStorage.clear();
		}
	} 
	localStorage._version = app.version;
	
	// open default page
	(function() {
		$content = $('.main.container .content.active');
		if($content.length) {
			// active content is already loaded, just highlight it
			$content.trigger('_show');
		} else {
			if(location.hash) {
				$(window).trigger('hashchange');
			} else if($.index) {
				// no location, open index
				$.view.open($.index);
			}
		}
	})()

	// hardlinks to softlinks
	$("body").delegate("a", "click", function() {
		var href = $(this).attr('href');
		if(href && 
			href.substr(0,1)!='#' &&
			href.indexOf('.html')!=-1) {
			location.href = '#' + href.substr(0, href.length-5);
			return false;
		}
		return true;
	})	
});

// app namespace for app globals
var app = {	};
app.login = function() {
	$.require('lib/views/login.js');
	if(!app.loginview)
		app.loginview = new LoginView();
	app.loginview.show();
}

$._views = {
	'editpage': {path:'lib/views/editpage.html'},
	'editprofile': {path:'lib/views/editprofile.js'},
	'register': {path:'lib/views/register.js'},
	'upload': {path:'lib/views/upload.html'},
	'pagelist': {path:'lib/views/pagelist.html'},
	'filelist': {path:'lib/views/filelist.html'},
	'userlist': {path:'lib/views/userlist.html'}
}
