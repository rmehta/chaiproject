/*
FormInput

Options
-------

name - name
type - default "text"
defaultval - [opt]
mandatory - true | false
min_length - [opt]
data_type - [opt] "email"
no_special - (only letters and numbers)

Properties
----------
$input

Methods
-------
validate

*/

var FormInputView = Class.extend({
	init: function(opts) {
		this.opts = opts;
		if(!this.opts.type) this.opts.type='text';
		if(!this.opts.help) this.opts.help='';
		this.make_input();
		this.set_properties();
		this.bind_events();			
	},
	make_input: function() {
		switch(this.opts.type) {
			case 'hidden':
				this.make_hidden();
				break;
			default:
				this.make_with_label();
		};			
	},
	make_hidden: function() {
		this.opts.$parent.append($.rep('\
			<input name="%(name)s" type="%(type)s">', this.opts));			
	},
	make_with_label: function() {
		this.opts.$parent.append($.rep('\
		<div class="clearfix">\
			<label>%(label)s</label>\
			<input name="%(name)s" type="%(type)s">\
			<div class="help-block">%(help)s</div>\
		</div>', this.opts));			
	},
	set_properties: function() {
		// set jquery object
		this.$input = this.opts.$parent.find(' [name="'+f.name+'"]');

		// set autocomplete for range
		if(this.opts.range) {
			$.require('lib/views/form/autocomplete.js')
			this.$input.set_autocomplete({type:this.opts.range});
		}
		
		// store field information for validations
		this.$input[0].fieldinfo = this.opts;
		this.$input[0].forminput = this;
	},
	validate: function() {
		var err = false;
		if(this.opts.type=='hidden') return;
		var val = this.$input.val();

		if(this.opts.mandatory && !val) {
			err = true;
		}
		if(this.opts.min_length && val.length < this.opts.min_length) {
			err = true;
		}
		if(this.opts.no_special && val.search(/[^\w\d]/)!=-1) {
			err = true;
		}
		if(this.opts.data_type) {
			if(this.opts.data_type=='email' && !$.is_email(val)) err = true;
		}
		this.$input.parent().toggleClass('error', err);
	},
	bind_events: function() {
		var me = this;
		this.$input.keyup(function() {
			me.validate();
		});
	}
});
