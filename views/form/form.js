/*
FormView
========

Options:
--------
$parent - parent jquery object
fields - list of fieldinfo objects (see forminput.js)
method - default "lib.py.objstore.insert"
primary_btn_label - default "Save"
primary_btn_working_label - default "Saving..."
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
		this.$wrapper = this.ismodal
			? $('#' + this.opts.id) 
			: this.opts.$parent.find('.form-wrapper:last');
		this.$form = this.opts.$parent.find('form:last');
		
		this.make_form_inputs();
		this.make_static_inputs();
		this.make_message();
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
	
	make_message: function() {
		this.$form.append('<div class="alert-message block-message form-message" style="display: none;">\
			</div>');
		this.$message = this.$form.find('.alert-message.form-message');
	},
	
	// footer includes message, primary action, secondary action
	footer_container: function() {
		if(this.ismodal) {
			return $('#' + this.opts.id + ' .modal-footer');
		} else {
			return $(this.$form.append('<div class="form-footer actions"></div>')).find('.actions');
		}
	},
	
	make_footer: function() {
		$.set_default(this.opts, 'primary_btn_label', 'Save')
		$.set_default(this.opts, 'primary_btn_working_label', 'Saving...')
		$.set_default(this.opts, 'secondary_btn_label', 'Cancel')				


		this.footer_container().append($.rep('<span class="form-message"></span>\
			<button class="btn primary">%(primary_btn_label)s</button>\
			<button class="btn secondary">%(secondary_btn_label)s</button>', this.opts));
			
		this.$primary_btn = this.$wrapper.find('button.btn.primary');
	},
	bind_events: function() {
		var me = this;
		this.$primary_btn.click(function() {
			return me.primary_action();
		});
		this.$wrapper.find('button.btn.secondary').click(function() {
			return me.secondary_action();
		});
		
		// enter on last input is primary action
		this.$wrapper.find('input:last[type!="hidden"]').bind('keydown', function(event) {
			if(event.which==13) {
				me.$primary_btn.click();
			}
		});
	},
	primary_action: function() {
		this.disable_actions();
		this.$primary_btn.text(this.opts.primary_btn_working_label);
		var obj = this.get_values();
		if(!obj) 
			return false;
		var me = this;
		$.call({
			method: this.opts.method || 'lib.py.objstore.insert',
			data: obj,
			type: 'POST',
			success: function(data) { 
				me.$primary_btn.text(me.opts.primary_btn_label);
				me.enable_actions();
				me.success(data); 
			}
		});
		return false;
	},
	disable_actions: function() {
		this.$wrapper.find('button.btn').attr('disabled', true);
	},
	enable_actions: function() {
		this.$wrapper.find('button.btn').attr('disabled', false);
	},
	validate: function() {
		$.each(this.inputlist, function(i, input) {
			input.validate();
		});
	},
	success: function(data) {
		if(data.message && data.message=='ok') {
			this.set_message('Success', 'success');
			if(this.opts.success)this.opts.success(data);
		} else {
			this.set_message(data.error, 'error');
			if(this.opts.error) this.opts.error(data);
		}			
	},
	get_values: function() {
		this.clear_message();
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
		this.clear_message();
		// clear form first (to defaults)
		$.each(this.inputlist, function(i, forminput) {
			var defval = forminput.opts ? forminput.opts.defaultval : '';
			if(forminput.$input)
				forminput.$input.val(defval);
		});
	},
	clear_message: function() {
		this.$message.empty()
			.css('display', 'none')
			.removeClass('error').removeClass('warning')
			.removeClass('success').removeClass('info');
	},
	set_message: function(msg, type, fadeOutIn) {
		this.clear_message();
		this.$message.css('display', 'block').html(msg)

		if(type) {
			this.$message.addClass(type);
		}
		
		if(fadeOutIn) {
			this.$message.fadeOut(fadeOutIn);
		}
	}
});