
// standard form actions
(function($) {
	// make a stacked form
	$.fn.validate_input = function() {
		var err = false;
		var f = this[0].fieldinfo;
		if(!f) return;
		if(f.type=='hidden') return;
		var val = this.val();
		
		if(f.mandatory && !val) {
			err = true;
		}
		if(f.min_length && val.length < f.min_length) {
			err = true;
		}
		if(f.no_special && val.search(/[^\w\d]/)!=-1) {
			err = true;
		}
		if(f.data_type) {
			if(f.data_type=='email' && !$.is_email(val)) err = true;
		}
		this.parent().toggleClass('error', err);
	}
	
	// return true if txt is
	// a valid email
	$.is_email = function(txt) {
		return txt.search("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")!=-1;
	}
	
	// call the validate_input method on
	// all inputs in the form
	$.fn.validate_form = function() {
		this.find(':input').each(function(idx, input) {
			$(input).validate_input();
		});
	}
	
	// make a stacked form from options
	$.fn.stacked_form = function(opts) {		
		this.append('<form class="form-stacked"></form>');
		var me = this;
		$.each(opts, function(i, f) {
			if(!f.type) f.type='text';
			if(!f.help) f.help='';
			
			switch(f.type) {
				case 'hidden':
					me.find('form').append($.rep('\
						<input name="%(name)s" type="%(type)s">', f));
					break;
				default:
					me.find('form').append($.rep('\
					<div class="clearfix">\
						<label>%(label)s</label>\
						<input name="%(name)s" type="%(type)s">\
						<div class="help-block">%(help)s</div>\
					</div>', f));
			}

			var $input = me.find(' [name="'+f.name+'"]');

			// store field information for
			// validations
			$input[0].fieldinfo = f;
		});
		
		// clear all
		me.find('form').set_values({});
	};
	
	$.fn.set_values = function(obj) {
		var me = this;
		// clear form first (to defaults)
		me.find(':input').each(function() {
			var defval = this.fieldinfo ? this.fieldinfo.defaultval : '';
			$(this).val(defval || '');
		});
		
		// set values
		$.each(obj, function(k,v) {
			me.find(' [name="'+k+'"]').val(v);
		});
	}
	
	// make a new modal
	$.modal_form = function(opts) {
		$.require('lib/js/bootstrap/bootstrap-modal.js');

		var id = '#'+opts.id;
		var me = {
			show: function() {
				// set values
				if(opts.obj) $(id + ' form').set_values(opt.obj)
				// show
				$(id).modal('show');
			},
			set_defaults: function() {
				// make
				$.set_default(opts, 'btn_primary_label', 'Save')
				$.set_default(opts, 'btn_secondary_label', 'Cancel')				
			},
			make: function() {
				me.set_defaults();
				me.make_modal();
				me.set_events();
				// add fields if reqd
				
				if(opts.fields)
					$(id+' .modal-body').stacked_form(opts.fields);
			},
			make_modal: function() {
				$(document.body).append($.rep('\
				<div class="modal hide fade" id="%(id)s">\
					<div class="modal-header">\
						<a href="#" class="close">&times;</a>\
						<h3>%(label)s</h3>\
						</div>\
					<div class="modal-body"></div>\
					<div class="modal-footer">\
						<span class="message"></span>\
						<button class="btn primary">%(btn_primary_label)s</button>\
						<button class="btn secondary">%(btn_secondary_label)s</button>\
					</div>\
				</div>\
				', opts))
			},
			set_events: function() {
				$(id+' button.btn.secondary').click(function() {
					$(id).modal('hide');					
				});

				// save in objectstore
				$(id+' button.btn.primary').click(me.saveobj);
				
				// enable / disable primary input based on form
				// only do it on keyup if the field is already
				// in error state
				$(id).delegate(':input', 'keyup', function() {
					// re-evaluate each input that is in
					// error state
					if($(this).parent().hasClass('error')) {
						$(this).validate_input();			
					}
					$(id+' button.btn.primary').attr('disabled',
						$(id+' .error').length ? true : false);
				});
			},
			saveobj: function() {
				$(id+' form').validate_form();
				// found errors
				if($(id+ ' .error').length) {
					return;
				}
				$.objstore.post($(id+' form').serialize(), function(data) {
					if(data.message && data.message=='ok') {
						$(id+' .message')
							.html('<span class="label success">Done!</span>').delay(1000).fadeOut();
					} else {
						$(id+' .message')
							.html('<span class="label important">'+data.error+'</span>');
							console.log(data.traceback);
					}
					if(data.log) {
						console.log(data.log);
					}
				});
			}
		}

		// show or make
		if(!$(id).length) {
			me.make();
			$(id).modal({backdrop:'static', show:false});
		}
	}
})(jQuery)