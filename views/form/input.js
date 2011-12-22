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
size - (2-12)

Properties
----------
$input

Methods
-------
validate
val(value) - get / set value (if input exists)

Events
------
this.$input -> value_change - called when value is changed by model or view

*/

var FormInputView = Class.extend({
	init: function(opts) {
		this.opts = opts;
		if(!this.opts.type) this.opts.type='text';
		if(!this.opts.help) this.opts.help='';

		this.make();
		this.set_properties();
		this.bind_events();
	},
	make: function() {
		this.make_wrapper();
		switch(this.opts.type) {
			case 'hidden':
				this.make_hidden();
				break;
			case 'html':
				this.make_html();
				break;
			default:
				this.make_with_label();
		};			
	},
	make_wrapper: function() {
		this.$wrapper = this.opts.$parent.append('<div class="form-input"></div>')
			.find('div.form-input:last');
	},
	make_with_label: function() {
		this.$wrapper.addClass('clearfix')
			.append($.rep('<label>%(label)s</label>\
			<div class="input-place-holder" \
				style="display: none; cursor: pointer; padding: 4px 0px; color: #888">\
				Click to add "%(label)s"</div>'
			+ this.make_input() +
			'<div class="help-block">%(help)s</div>', this.opts));
			
		this.$placeholder = this.$wrapper.find('.input-place-holder');
	},
	make_hidden: function() {
		this.$wrapper.append($.rep('\
			<input name="%(name)s" type="%(type)s" value="%(value)s">', this.opts));			
	},
	make_input: function() {
		switch(this.opts.type) {
			case 'textarea':
				return $.rep('<textarea name="%(name)s" class="span10 code"></textarea>', this.opts);
				break;
			default:
				return $.rep('<input name="%(name)s" type="%(type)s">', this.opts);
		}
	},
	make_html: function() {
		this.$wrapper.append(this.opts.content);
	},
	set_properties: function() {
		// set jquery object
		this.$input = this.$wrapper.find(':input');

		if(!this.$input) 
			return;
			
		// set autocomplete for range
		if(this.type==='text' && this.opts.range) {
			$.require('lib/views/form/autocomplete.js')
			this.$input.set_autocomplete({type:this.opts.range});
		}
		
		// store field information for validations
		this.$input.get(0).forminput = this;
	},
	std_validate: function() {
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
		if(!this.$input) return;
		var me = this;
		this.$input.keyup(function() {
			me.std_validate();
			if(me.validate) me.validate(this);
			$(this).trigger('value_change');
		});
		if(!this.opts.mandatory && this.$placeholder) {
			this.edit_onclick();
			this.editable(false);
		}
	},
	editable: function(value) {
		if(!value && value!==0) {
			this.$placeholder.css('display', 'block');
			this.$input.css('display', 'none');			
		} else {
			this.$placeholder.css('display', 'none');
			this.$input.css('display', 'block');			
		}
	},
	edit_onclick: function() {
		var me = this;
		this.$input.bind('value_change', function(event) {
			me.editable($(this).val());
		});
		this.$input.blur(function(event) {
			me.editable($(this).val());
		});
		this.$placeholder.click(function() {
			me.editable(true);
			me.$input.focus();
		});
	},
	val: function(t) {
		if(!this.$input)
			return null;
		var value = this.$input.val(t);
		this.$input.trigger('value_change');
		return value;
	}
});
