
// standard form actions
(function($) {
	// pass url and data in option
	$.fn.delete_table_row = function(opts) {
		opts.data._method = "lib.py.objstore.delete"
		this.delegate('button.delete-row-btn', 'click', function() {
			var $me = $(this);
			$me.attr('disabled',true).html('Deleting...');
			$.ajax({
				url: "server/",
				type: "POST",
				data: $.extend((opts.data || {}), 
					{name:$me.attr("data-name")}),
				success: function(data) {
					if(data.message=='ok') {
						$me.parent().parent().slideUp();			
					} else {
						alert(data.error);
						$me.attr('disabled',false).html('Delete');
					}
				}
			});
		});		
	}
})(jQuery)