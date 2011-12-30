/*
Upload View
===========

Usage: app.uploadview('show')
*/

$.require('lib/js/bootstrap/bootstrap-modal.js');
$.require('lib/js/jquery/jquery.form.js');

var UploadView = Class.extend({
	init: function() {
		this.make_modal();
		this.bind_events();
		this.setup_form();
	},
	make_modal: function() {
		$('body').append('<div class="modal hide fade" id="upload">\
			<div class="modal-header">\
				<a href="#" class="close">&times;</a>\
				<h3>Upload a File</h3>\
			</div>\
			<div class="modal-body">\
				<form class="form-stacked" method="POST" action="/" enctype="multipart/form-data">\
					<input name="mimetype" type="hidden" value="json">\
					<input name="_method" type="hidden" value="lib.chai.files.post">\
					<div class="clearfix">\
						<input name="filedata" type="file" />\
					</div>\
					<div class="message"></div>\
					<br><br>\
				</form>\
			</div>\
			<div class="modal-footer">\
				<span class="message"></span>\
				<button class="btn primary">Upload</button>\
				<button class="btn secondary" onclick="app.uploadview.modal(\'hide\')">Close</button>\
			</div>\
		</div>');
		this.$modal = $('#upload');
	},
	
	// bind events
	bind_events: function() {
		$('#upload form input[name=filedata]').change(function() {
			if($(this).val()) {
				$('#upload button.primary').attr('disabled', false);		
			} else {
				$('#upload button.primary').attr('disabled', true);
			}
		});
		
		// reset on show
		$('#upload').bind('show', this.reset);
		
		// trigger post on click
		$('#upload button.btn.primary').click(function() {
			$('#upload form').trigger('submit');
		})
		
	},
	
	// reset form
	reset: function() {
		$('#upload form .message').html('');
		$('#upload form input[name=filedata]').css('display', 'inline').val('');
		$('#upload button.primary').attr('disabled', true).css('display','inline');
		$('#upload').modal({backdrop:'static', show: false});
	},
	
	// validate form
	// show messages
	setup_form: function() {
		$('#upload form').ajaxForm({
			beforeSubmit: function() {
				$('#upload button.primary').attr('disabled', true);
				$('#upload form input[name=filedata]').css('display', 'none');
				$('#upload form .message').html('<span class="label">Sending...</span>');
			},
			success: function(data) {
				data = JSON.parse(data);
				$('#upload button.primary').css('display','none');
				if(data.message && data.message=='ok') {
					$('#upload form .message').html('<span class="label success">'+
						data.fname + ' uploaded</span>');
				} else {
					$('#upload form .message').html('<span class="label important">'+
						data.error + '</span>');			
				}
			}
		});
	}
});

app.show_upload = function() {
	if(!app.uploadview)
		app.uploadview = new UploadView();
	app.uploadview.$modal.modal({backdrop:'static', show:true});
}
