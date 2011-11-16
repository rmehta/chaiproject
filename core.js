(function($) {
	// python style string replace
	$.rep = function(s, dict) {
		for(key in dict) {
		    var re = new RegExp("%\\("+ key +"\\)s", "g");
			s = s.replace(re, dict[key]);
		}
	    return s;
	}
	// import css / js files
	$.set_style = function(css) {
		$('head').append('<style type="text/css">'+css+'</style>')
	};
	$.set_script = function(js) {
		$('head').append('<script language="javascript">'+js+'</script>');
	};
	$.random = function(n) {
		return Math.ceil(Math.random()*n)-1;
	};
	$.set_default = function(d, k, v) {
		if(!d[k])d[k]=v;
	}
})(jQuery);

// $.require
// http://plugins.jquery.com/project/require
(function($) {
	$.require = function(files, params) {
		var params = params || {};

		if (!$.require.loaded) 
			$.require.loaded = {};

		if (!$.require.path )
			$.require.path = '';

		if (typeof files === "string") {
			files = new Array(files);
		}
		$.each(files, function(n, file) {
			if (!$.require.loaded[file]) {
				var extn = file.split('.').slice(-1);
				xhr = $.ajax({
					type: "GET",
					url: $.require.path + files[n],
					success: params.callback || null,
					dataType: extn=="js" ? "script" : "text",
					cache: params.cache===false?false:true,
					async: false
				});
				$.require.loaded[file] = true;
				if(extn=="css") {
					$.set_style(xhr.responseText);
				}
			}
		})
		//console.dir($.require.loaded);

		return $;
	};
})(jQuery);


// object store wrapper
$.objstore = {
	data: {},
	set: function(obj) {
		var d = $.objstore.data;
		if(!d[obj.type])
			d[obj.type] = {}
		d[obj.type][obj.name] = obj;
	},
	get:function(type, name, callback) {
		var d = $.objstore.data;
		if(d[type] && d[type][name]) {
			callback(d[type][name]);
		} else {
			$.getJSON('lib/py/objstore.py', {"type":type, "name":name}, function(obj) {
				$.objstore.set(obj);
				callback(obj);
			});
		}
	},
	post: function(obj, success) {
		$.ajax({
			url:'lib/py/objstore.py',
			type: 'POST',
			data: obj,
			success: success
		});		
	},
	clear: function(type, name) {
		if(d[type] && d[type][name])
			delete d[type][name];
	}
}


// view
$.view = {
	pages: {},
	type: function(html) {
		if(html.search(/<\!--\s*type:\s*modal\s*-->/)!=-1) {
			return 'modal';
		} else if(html.search(/<\!--\s*type:\s*script\s*-->/)!=-1) {
			return 'script'
		} else {
			return 'page';
		}
	},
	load: function(name, path, type, callback) {
		if(!$('#'+name).length) {
			if(path) 
				$.view.load_files(name, path, type, callback);
			else
				$.view.load_object(name, callback);
		}
		callback();
	},
	load_files: function(name, path, type, callback) {
		if(type=='script') {
			$.getScript(path + name + '.js', callback);
		} else {
			$.get(path + name + '.html', function(html) {
				switch($.view.type(html)) {
					case 'modal': 
						$.view.render_modal(name, html)
						break;
					case 'page':
						$.view.render_page(name, html);
				}
				callback();
			});
		}
		
	},
	render_modal: function(name, html) {
		$(document.body).append(html);
		$('#'+name).bind('hidden', function() {
			window.history.back();
		})
	},
	render_page: function(name, html) {
		$('<div>')
			.addClass('content')
			.attr('id', name)
			.appendTo('.main.container')
			.html(html);
	},
	load_object: function(name, callback) {
		$.objstore.get("page", name, 
			function(obj) {
				$.view.make(obj);
				callback();
			}
		);
	},
	make: function(obj) {
		$.view.render_page(obj.name, obj.html);
		if(obj.js)
			$.set_script(obj.js);
		if(obj.css)
			$.set_style(obj.css);
		$("#"+name).trigger('_render');

	},
	show: function(name, path, type) {
		$.view.load(name, path, type, function() {
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
	}
}


// open page
$.open_page = function(name) {
	if(name[0]=='#') { name = name.substr(1); }
	if(name[0]=='!') { name = name.substr(1); }
	if(name.indexOf('/')!=-1) {
		name = name.split('/')[0];
	}
	if(!name)name='index'
	var p = $._plugins[name] || {};
	$.view.show(name, p.path, p.type);
}


$(window).bind('hashchange', function() {
	$.open_page(decodeURIComponent(location.hash));
});


// ready to fly
$(document).ready(function() {
	$.get('lib/plugins/toolbar.html', function(data) {
		$('body').append(data);
	});

	(function() {
		$content = $('.main.container .content.active');
		if($content.length) {
			$content.trigger('_show');
		}
		if(location.hash) {
			$.open_page(location.hash);
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

$._plugins = {
	'editpage': {path:'lib/plugins/'},
	'editprofile': {path:'lib/plugins/', type:'script'},
	'signin': {path:'lib/plugins/'},
	'upload': {path:'lib/plugins/'},
	'pagelist': {path:'lib/plugins/'},
	'filelist': {path:'lib/plugins/'},
	'userlist': {path:'lib/plugins/'}
}
