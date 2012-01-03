/*
FormView
========

Options:
--------
$parent - parent jquery object
fields - list of fieldinfo objects (see forminput.js)
method - default "lib.chai.objstore.insert"
primary_btn_label - default "Save"
primary_btn_working_label - default "Saving..."
btn_secondary_label - default "Cancel"
success - called after post
submit_from_last_input - enter on last input is submit
getdata - if this function is exists, data is passed to this function before calling

Properties:
-----------
inputlist - list of FormInputView objects
inputdict - dict of FormInputView objects (key is the "name")
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
		this.make_body();

		$.require('lib/chaijs/form/input.js');
		
		this.make_form_inputs();
		this.make_static_inputs();
		this.make_message();
		this.make_footer();
		this.controller = new FormController(this);
		this.sidebar = new FormSidebarView(this);
	},
	make_body: function() {
		this.opts.$parent.append('<div class="form-wrapper">\
				<div class="item-box round span3 form-item-box" \
					style="float: right; display: none; padding-bottom: 4px">\
					<h5>Actions</h5>\
				</div>\
				<form class="" action="javascript:void(0);">\
					<fieldset></fieldset>\
				</form>\
			</div>');
		this.$wrapper = this.ismodal
			? $('#' + this.opts.id) 
			: this.opts.$parent.find('.form-wrapper:last');
		this.$form = this.$wrapper.find('form');
	},
	make_form_inputs: function() {
		// create inputs
		for(var i in this.opts.fields) {
			this.make_input(this.opts.fields[i]);
		}
	},
	make_input: function(fieldopts) {
		fieldopts.$parent = this.$form.find('fieldset');
		
		var forminputview = app.input_factory(fieldopts)
		this.inputlist.push(forminputview);
		if(fieldopts.name)
			this.inputdict[fieldopts.name] = forminputview;
	},
	make_static_inputs: function() {
		if(!this.opts.static) return;
		for(key in this.opts.static) {
			this.make_input({
				type: 'hidden',
				name: key, 
				value: this.opts.static[key],
				defaultval: this.opts.static[key]
			});
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
		$.set_default(this.opts, 'submit_from_last_input', false);

		this.footer_container().append($.rep('<span class="form-message"></span>\
			<button class="btn primary">%(primary_btn_label)s</button>\
			<button class="btn secondary" style="display: none">%(secondary_btn_label)s</button>', this.opts));
			
		this.$primary_btn = this.$wrapper.find('button.btn.primary');
	},
	get_values: function() {
		this.clear_message();
		if(this.$wrapper.find('.error').length) {
			return;
		}
		var d = {};
		for(var k in this.inputdict) {
			d[k] = this.inputdict[k].val();
		}
		return d;
	},
	get_value: function(key) {
		if(this.inputdict[key]) {
			return this.inputdict[key].val();
		}
	},
	set_values: function(obj) {
		this.reset();
		// set values
		for(k in obj) {
			if(this.inputdict[k])
				this.inputdict[k].set_val(obj[k]);
		}
	},
	reset: function() {
		this.clear_message();
		// clear form first (to defaults)
		$.each(this.inputlist, function(i, forminput) {
			var defval = forminput.opts ? forminput.opts.defaultval : '';
			forminput.set_val(defval);
		});
	},
	clear: function() {
		return this.reset();
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

/*

Form sidebar will either be the global sidebar or will be generated from 
the form

*/
var FormSidebarView = Class.extend({
	init: function(view) {
		this.view = view;

		var pageid = view.$wrapper.closest('.content-wrap').attr('id');
		var $sidebar = $('#sidebar-' + pageid);
		
		if(!view.ismodal && $sidebar.length) {
			this.$sidebox = $sidebar;
		} else {
			this.$sidebox = view.$wrapper.find('.form-item-box');
		}
	},
	add_item: function(label, action) {
		var me = this;
		this.$sidebox.append($.rep('<div class="item-box-item">\
			<a href="#" onclick="return false">%(label)s</a></div>', {label:label}))
		this.$sidebox.find('.item-box-item:last').click(function() {
			action(me);
		});
	}
});

var FormController = Class.extend({
	init: function(view) {
		this.view = view;
		this.opts = view.opts;
		this.bind_events();
	},
	bind_events: function() {
		var me = this;
		this.view.$primary_btn.click(function() {
			return me.primary_action();
		});
		this.view.$wrapper.find('button.btn.secondary').click(function() {
			return me.secondary_action();
		});
		
		// enter on last input is primary action
		if(this.opts.submit_from_last_input) {
			this.view.$wrapper.find('input:last[type!="hidden"]').bind('keydown', function(event) {
				if(event.which==13) {
					me.view.$primary_btn.click();
				}
			});
		}
	},
	primary_action: function() {
		this.disable_actions();
		this.view.$primary_btn.text(this.opts.primary_btn_working_label);

		var obj = this.getdata();
		if(!obj) return false;

		$.set_default(this.opts, 'method', 'lib.chai.objstore.insert')

		var me = this;
		$.call({
			method: this.opts.method,
			data: obj,
			type: 'POST',
			success: function(data) { 
				me.view.$primary_btn.text(me.opts.primary_btn_label);
				me.enable_actions();
				me.success(data); 
			}
		});
		return false;
	},
	getdata: function() {
		var obj = this.view.get_values();
		for(k in obj) {
			if(typeof obj[k] == 'object') {
				return {obj: JSON.stringify(obj)}
			}
		}
		return obj
	},
	disable_actions: function() {
		this.view.$wrapper.find('button.btn').attr('disabled', true);
	},
	enable_actions: function() {
		this.view.$wrapper.find('button.btn').attr('disabled', false);
	},
	validate: function() {
		$.each(this.view.inputlist, function(i, input) {
			input.validate();
		});
	},
	success: function(data) {
		if(data.message && data.message=='ok') {
			if(this.opts.success)this.opts.success(data);
			if(data.obj) {
				chai.objstore.set(data.obj);
			}
		} else {
			$.notify('There were errors', 'important');
			if(this.opts.error) this.opts.error(data);
		}			
	}
});