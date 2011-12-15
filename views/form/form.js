/*
FormView
========

Options:
--------
$parent - parent jquery object
fields - list of fieldinfo objects (see forminput.js)
method - default "lib.py.objstore.insert"
btn_primary_label - default "Save"
btn_secondary_label - default "Cancel"
success - called after post


Properties:
-----------
inputlist - list of FormInputView objects
inputsdict - dict of FormInputView objects (key is the "name")
$wrapper
$form
$message


Methods:
--------
reset()
get_values()
set_values(dict)
set_message(message, type, fadeOutIn)


Styles:
-------
div.form-wrapper 
form.form-stacked
div.form-footer
div.form-message


Structure:
----------
<div form-wrapper>
  <form form-stacked>
     <input>..
  </form>
  <div form-footer>
     <span message>
     <button primary>
     <button secondary>
  </div>
</div>
*/

var FormView = Class.extend({
	init: function(opts) {
		this.inputlist = [];
		this.inputdict = {};

		if(opts)this.opts = opts;
		if(!this.opts) return; // not ready
		
		this.opts.$parent.append('<div class="form-wrapper"><form class="form-stacked"></form></div>');
		this.$wrapper = this.opts.$parent.find('.form-wrapper:last');
		this.$form = this.opts.$parent.find('form:last');
		
		this.make_form_inputs();
		this.make_static_inputs();
		this.make_footer();
		this.bind_events();		
	},
	make_form_inputs: function() {
		$.require('lib/views/form/input.js');
		// create inputs
		for(var i in this.opts.fields) {
			f = this.opts.fields[i];
			f.$parent = this.$form;
			
			var forminputview = new FormInputView(f)
			this.inputlist.push(forminputview);
			this.inputdict[f.name] = forminputview;		
		}
	},
	make_static_inputs: function() {
		if(!this.opts.static) return;
		for(key in this.opts.static) {
			new FormInputView({
				type:'hidden',
				name:key, 
				value:this.opts.static[key],
				$parent: this.$form
			})
		}
	},
	// footer includes message, primary action, secondary action
	make_footer: function() {
		$.set_default(this.opts, 'btn_primary_label', 'Save')
		$.set_default(this.opts, 'btn_secondary_label', 'Cancel')				

		this.$wrapper.append($.rep('<div class="form-footer">\
			<span class="form-message"></span>\
			<button class="btn primary">%(btn_primary_label)s</button>\
			<button class="btn secondary">%(btn_secondary_label)s</button>\
		</div>', this.opts));
		this.$message = this.$wrapper.find('.form-footer .form-message');
	},
	bind_events: function() {
		var me = this;
		this.$wrapper.find('button.btn.primary').click(function() {
			me.primary_action();
		});
		this.$wrapper.find('button.btn.secondary').click(function() {
			me.secondary_action();
		});
		
		// enter on last input is primary action
		this.$form.find(':input:last[type!="hidden"]').bind('keydown', function(event) {
			if(event.which==13) {
				me.$wrapper.find('#button.primary').click();
			}
		});
	},
	primary_action: function() {
		console.log(2);
		var obj = this.get_values();
		console.log(obj)
		if(!obj) return;
		var me = this;
		$.call({
			method: this.opts.method || 'lib.py.objstore.insert',
			data: obj,
			type: 'POST',
			success: function(data) { me.success(data); }
		});
	},
	validate: function() {
		$.each(this.inputlist, function(i, input) {
			input.validate();
		});
	},
	success: function(data) {
		if(data.message && data.message=='ok') {
			this.set_message('Success', 'success', 4000);
			if(this.opts.success)this.opts.success(data);
		} else {
			this.set_message(data.error, 'important', 4000);
			if(this.opts.error) this.opts.error(data);
		}			
	},
	get_values: function() {
		if(this.$wrapper.find('.error').length) {
			return;
		}
		var d = {};
		this.$form.find(':input').each(function(i, ele) {
			if($(ele).attr('name')) 
				d[$(ele).attr('name')] = $(ele).val();
		});
		return d;
	},
	set_values: function(obj) {
		this.reset();
		// set values
		for(k in obj) {
			this.$form.find(' [name="'+k+'"]').val(obj[k]);
		}
	},
	reset: function() {
		this.$message.empty();
		
		// clear form first (to defaults)
		$.each(this.inputlist, function(i, forminput) {
			var defval = forminput.opts ? forminput.opts.defaultval : '';
			forminput.$input.val(defval);
		});
	},
	set_message: function(msg, type, fadeOutIn) {
		this.$message.html(
			$.rep('<span class="label %(type)s">%(msg)s</span>', {msg:msg, type:type || ''}));
		if(fadeOutIn) {
			this.$message.find('.label').fadeOut(fadeOutIn);
		}
	}
});