/* form library to create forms and save them as objects
created by @rushabh_mehta
license: MIT

FormView

Options:

"$parent": <container>
"fields": <fields>
	
	
ModalFormView


Usage:
------
$.modal_form({
	"id": <dom id (new)>,
	"label": <Label>
	"fields": [ <fieldinfo> ],
	"action": [ "insert" (default) | "update"],
	"method": [optional], server method default "lib.py.objstore[action]",
	"btn_primary_label": [optional, "Save" (default)]
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
	// call the validate_input method on
	// all inputs in the form
	$.fn.validate_form = function() {
		this.find(':input').each(function(idx, input) {
			$(input).validate_input();
		});
	};
	
		
	// set a messages in the class "message" div of this object
	$.fn.set_message = function(msg, type, fadeOutIn) {
		this.find('.message').html('<span class="label '+(type || '')+'">'+
			msg
		+'</span>');
		if(fadeOutIn) {
			this.find('.message .label').fadeOut(fadeOutIn)
		}
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
				
				// focus on first input on show
				$(id).bind('shown', function() {
					$(id + ' :input:first[type!="hidden"]').focus()
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
				$.objstore[opts.action || 'insert']($(id+' form').form_values(), function(data) {
					if(data.message && data.message=='ok') {
						$(id).set_message('Done!', 'success', 1000);
						$(id+' form').trigger('save');
					} else {
						$(id).set_message(data.error, 'important', 1000);
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