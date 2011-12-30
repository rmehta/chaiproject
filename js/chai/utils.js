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