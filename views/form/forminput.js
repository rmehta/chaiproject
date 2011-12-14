/*
FormInput
*/

FormInputView = function(opts) {
	var me = this;
	$.extend(this, {
		init: function() {
			if(!opts.type) opts.type='text';
			if(!opts.help) opts.help='';
			me.make_input();
			me.set_properties();
			me.bind_events();			
		},
		make_input: function() {
			switch(opts.type) {
				case 'hidden':
					me.make_hidden();
					break;
				default:
					me.make_with_label();
			};			
		},
		make_hidden: function() {
			opts.$parent.append($.rep('\
				<input name="%(name)s" type="%(type)s">', opts));			
		},
		make_with_label: function() {
			opts.$parent.append($.rep('\
			<div class="clearfix">\
				<label>%(label)s</label>\
				<input name="%(name)s" type="%(type)s">\
				<div class="help-block">%(help)s</div>\
			</div>', opts));			
		},
		set_properties: function() {
			// set jquery object
			opts.$input = opts.$parent.find(' [name="'+f.name+'"]');

			// set autocomplete for range
			if(opts.range) {
				$.require('lib/views/form/autocomplete.js')
				opts.$input.set_autocomplete({type:opts.range});
			}
			
			// store field information for validations
			opts.$input[0].fieldinfo = opts;
		},
		validate: function() {
			var err = false;
			if(opts.type=='hidden') return;
			var val = me.$input.val();

			if(opts.mandatory && !val) {
				err = true;
			}
			if(opts.min_length && val.length < opts.min_length) {
				err = true;
			}
			if(opts.no_special && val.search(/[^\w\d]/)!=-1) {
				err = true;
			}
			if(opts.data_type) {
				if(opts.data_type=='email' && !$.is_email(val)) err = true;
			}
			me.$input.parent().toggleClass('error', err);
		},
		bind_events: function() {
			me.$input.keyup(function() {
				me.validate();
			});
		}
	});
	this.init();	
}
