/*
setup autocomplete on form input
*/
(function($) {
	// set autocomplete on this input
	// opts: {type:<type>}
	$.fn.set_autocomplete = function(opts) {
		$.require('lib/js/jquery/jquery.ui.autocomplete.js');
		$.require('lib/js/jquery/jquery.ui.css');
		this.autocomplete({
			source: function(request, response) {
				filters = (opts.filters || []);
				filters.push(["name", "like", request.term + '%']);
				$.call({
					method: 'lib.py.query.get',
					data: {
						type: opts.type,
						columns: opts.columns || "name",
						filters: JSON.stringify(filters),
						order_by: opts.order_by || "name asc",
						limit: opts.limit || "20"
					}, 
					success: function(data) {
						response($.map(data.result, function(item) {
							return {
								label: item[(opts.label || "name")], 
								value: item[(opts.value || "name")]
							}
						}));
					}
				})
			}
		})
	}
}