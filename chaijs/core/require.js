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