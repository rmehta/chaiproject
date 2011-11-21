/* form library to create forms and save them as objects
created by @rushabh_mehta
license: MIT

Usage:
------
$.modal_form({
	"id":"myform",
	"label": "My Form"
	"fields": [ <fieldinfo> ]
})

`fieldinfo` 
-----------
is a standard way of declaring form fields
properties include:

	"name" (name)
	"type" (input type)
	"defaultval" (default value)
	"mandatory" (if mandatory)
	"min_length"
	"data_type" (one of "email",)
	"no_special" (only letters and numbers)

`$(<form selector>).set_values(obj)`
	set values on form (will clear and then set)

`$(selector).stacked_form(fields)`
	create a form with the given fields

`$(<form>).form_values()`
	returns form values as dict

Events:
-------
	$(<form>)->'save' // success
	$(<form>)->'save_error' // error
*/


(function($) {
	$.fn.form_values = function() {
		var d = {}
		this.find(':input').each(function(i, ele) {
			if($(ele).attr('name')) d[$(ele).attr('name')] = $(ele).val();
		});
		return d;
	}
	
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
	
	// call the validate_input method on
	// all inputs in the form
	$.fn.validate_form = function() {
		this.find(':input').each(function(idx, input) {
			$(input).validate_input();
		});
	};
	
	// set autocomplete on this input
	// opts: {type:<type>}
	$.fn.set_autocomplete = function(opts) {
		$.require('lib/js/jquery/jquery.ui.autocomplete.js');
		$.require('lib/js/jquery/jquery.ui.css');
		this.autocomplete({
			source: function(request, response) {
				filters = (opts.filters || []);
				filters.push(["name", "like", request.term + '%']);
				$.ajax({
					url:"lib/py/query.py",
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

			if(f.range) {
				$input.set_autocomplete({type:"user"});
			}

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
				$(id+' button.btn.primary').click(me.onsave);
				
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
			onsave: function() {
				$(id+' form').validate_form();
				// found errors
				if($(id+ ' .error').length) {
					return;
				}
				me.saveobj($(id+' form').form_values());
			},
			
			saveobj: function(obj) {
				$.objstore.post($(id+' form').form_values(), function(data) {
					if(data.message && data.message=='ok') {
						$(id+' .message')
							.html('<span class="label success">Done!</span>').delay(1000).fadeOut();
							$(id+' form').trigger('save');
					} else {
						$(id+' .message')
							.html('<span class="label important">'+data.error+'</span>');
							console.log(data.traceback);
							$(id+' form').trigger('save_error', data);
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
		
		
		// override
		if(opts.saveobj) {
			me.saveobj = opts.saveobj
		}
	}
})(jQuery)