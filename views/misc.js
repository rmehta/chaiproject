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
	}


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

	}

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
	}	
})(jQuery);