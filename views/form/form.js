/*
FormView

Options:
--------
$parent - parent jquery object
fields - list of fieldinfo objects (see forminput.js)
method - default "lib.py.objstore.insert"
btn_primary_label - default "Save"
btn_secondary_label - default "Cancel"

Styles:
-------
div.form-wrapper 
form.form-stacked
div.form-footer
div.form-message

Properties:
-----------
$wrapper
$form
$message
$btn_primary
$btn_secondary

Methods:
--------
reset()
get_values()
set_values(dict)


*/

$.require('lib/views/form/forminput.js');

function FormView(opts) {
	var me = this;
	me.opts = opts;
	$.extend(me, {
		init: function() {
			opts.$parent.append('<div class="form-wrapper"><form class="form-stacked"></form></div>');
			me.$wrapper = opts.$parent.find('.form_wrapper:last');
			me.$form = opts.$parent.find('form:last');
			
			me.make_form_inputs();
			me.make_footer();
			me.bind_events();

			// clear all
			me.find('form').set_values({});
			
		},
		make_form_inputs: function() {
			// create inputs
			$.each(opts.fields, function(i, f) {
				f.$parent = me.$form;
				new FormInputView(f);
			});
		},
		// footer includes message, primary action, secondary action
		make_footer: function() {
			$.set_default(opts, 'btn_primary_label', 'Save')
			$.set_default(opts, 'btn_secondary_label', 'Cancel')				

			me.$wrapper.append($.rep('<div class="modal-footer form-footer">\
				<span class="form-message"></span>\
				<button class="btn primary">%(btn_primary_label)s</button>\
				<button class="btn secondary">%(btn_secondary_label)s</button>\
			</div>', opts))
		},
		bind_events: function() {
			me.$wrapper.find('button.primary').click(function() {
				me.primary_action();
			});
			me.$wrapper.find('button.secondary').click(function() {
				me.secondary_action();
			});
		},
		primary_action: function() {
			$.call({
				method: opts.method || 'lib.py.objstore.insert',
				data: me.getvalues(),
				type: 'POST',
				success: me.success
			})
		},
		success: function(data) {
			me.$form.trigger('success');
		}
		get_values: function() {
			var d = {}
			me.$form.find(':input').each(function(i, ele) {
				if($(ele).attr('name')) d[$(ele).attr('name')] = $(ele).val();
			});
			return d;
		},
		set_values: function(obj) {
			me.reset();
			// set values
			$.each(obj, function(k,v) {
				me.$form.find(' [name="'+k+'"]').val(v);
			});
		}
		reset: function() {
			// clear form first (to defaults)
			me.$form.find(':input').each(function() {
				var defval = this.fieldinfo ? this.fieldinfo.defaultval : '';
				$(this).val(defval || '');
			});			
		},
	});
	me.init();
}