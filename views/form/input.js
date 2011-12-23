/*
FormInput

Make form inputs of types text, textarea, hidden, listview, HTML
Usually called from a Form - with standard validation etc

Usage
-----

app.input_factory({Options})

Options
-------

name - name
type - one of (text | textarea | hidden | listview | html)
defaultval - [opt]
mandatory - true | false
min_length - [opt]
data_type - [opt] "email"
no_special - (only letters and numbers)
size - (2-12)

Properties
----------
$w - wrapper
$input - input element

Methods
-------
validate
val(value) - get / set value (if input exists)

Events
------
this.$input -> change - called when value is changed by model

Classes
-------
FormInput
	FormInputWithLabel
		FormInputText
		FormInputTextarea
	FormInputHidden
	FormInputHTML
	FormInputListItem


*/

app.input_factory = function(opts) {
	$.set_default(opts, 'type', 'text')
	switch(opts.type) {
		case 'text':
		 	return new FormInputText(opts);
		case 'hidden':
	 		return new FormInputHidden(opts);
		case 'html':
	 		return new FormInputHTML(opts);
		case 'textarea':
	 		return new FormInputTextarea(opts);
		case 'itemlist':
 			return new FormInputItemList(opts);
	}
}

var FormInput = Class.extend({
	init: function(opts) {
		this.opts = opts;
		if(!this.opts.type) this.opts.type='text';
		if(!this.opts.help) this.opts.help='';

		this.make();
		this.bind_events();
	},
	make: function() {
		this.make_wrapper();
		this.make_input();
	},
	make_wrapper: function() {
		this.$w = this.opts.$parent.append('<div class="form-input"></div>')
			.find('div.form-input:last');
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
	
	// call validate on change
	bind_events: function() {
	
	},
	
	set_val: function(v) {
		if(!this.$input) return;
		this.$input.val(v).trigger('change');		
	},
	
	// get / set value
	// trigger "change" on set
	val: function(v) {
		if(v) {
			this.set_val(v);
			return;
		}
		if(!this.$input)
			return null;
		return this.$input.val();
	}
});


FormInputHidden = FormInput.extend({
	make_input: function() {
		this.$w.append($.rep('\
			<input name="%(name)s" type="%(type)s" value="%(value)s">', this.opts));		
		this.$input = this.$w.find(':input');
	}
});


FormInputHTML = FormInput.extend({
	make_input: function() {
		this.$w.append(this.opts.content);
	}
});


FormInputItemList = FormInput.extend({
	make_input: function() {
		$.require('lib/views/form/itemlist.js');
		this.$w.append('<label>'+this.opts.label+'</label>');
		this.itemlist = new ItemListView({
			$parent: this.$w,
			range: this.opts.range,
			label: 'Sub Page'
		});
	},
	set_val: function(lst) {
		this.itemlist.controller.clear();
		this.itemlist.controller.add_items(lst || []);
		return;		
	},
	val: function(lst) {
		if(lst) {
			this.set_val(lst);
		} else {
			return ret = this.itemlist.controller.get_items();
		}
	}
});


FormInputWithLabel = FormInput.extend({
	make_input: function(opts) {
		this.$w.addClass('clearfix')
			.append($.rep('<label>%(label)s</label>\
			<div class="input-place-holder" \
				style="display: none; cursor: pointer; padding: 4px 0px; color: #888">\
				Click to add "%(label)s"</div>'
			+ this.make_input_element() +
			'<div class="help-block">%(help)s</div>', this.opts));
			
		this.$input = this.$w.find(':input');
		this.$placeholder = this.$w.find('.input-place-holder');	
	},
	bind_events: function() {
		this._super();
		
		// validate on keyup
		var me = this;
		this.$input.keyup(function() {
			me.std_validate();
			if(me.validate) me.validate(this);
		});
				
		// additionally, bind events to show input if empty
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
		this.$input.bind('change', function(event) {
			me.editable($(this).val());
		});
		this.$input.blur(function(event) {
			me.editable($(this).val());
		});
		this.$placeholder.click(function() {
			me.editable(true);
			me.$input.focus();
		});
	}
});


FormInputText = FormInputWithLabel.extend({
	make_input_element: function() {
		return $.rep('<input name="%(name)s" type="%(type)s">', this.opts);
	},
	bind_events: function() {
		this._super();
		// set autocomplete for range
		if(this.opts.range) {
			$.require('lib/s/form/autocomplete.js');
			this.$input.set_autocomplete({type:this.opts.range});
		}
	}
});


FormInputTextarea = FormInputWithLabel.extend({
	make_input_element: function() {
		return $.rep('<textarea name="%(name)s" class="span10 code"></textarea>', this.opts);
	},
});