/*
FormModalView, extends FormView
===============================

Options:
--------
id - id of modal
label - modal title


Properties:
-----------
$modal


Methods:
--------
show
hide

*/

$.require('lib/js/bootstrap/bootstrap-modal.js');
$.require('lib/chaijs/form/form.js');

var FormModalView = FormView.extend({
	init: function(opts) {
		this.ismodal = true;
		this.opts = opts;
		
		// make modal
		this.make_modal();
		this.bind_modal_events();
		
		// render the form
		this._super();
		
		// form always stacked
		this.$form.addClass('form-stacked');
		
		var me = this;
		
		this.secondary_action = function() {
			me.$modal.modal('hide')
		}
		// show secondary btn
		this.$wrapper.find('button.btn.secondary').css('display', 'block');		

		
		// setup modal
		this.$modal.modal({backdrop:'static', show:false});
	},
	make_modal: function() {
		$(document.body).append($.rep('\
		<div class="modal hide fade" id="%(id)s">\
			<div class="modal-header">\
				<a href="#" class="close">&times;</a>\
				<h3>%(label)s</h3>\
				</div>\
			<div class="modal-body"></div>\
			<div class="modal-footer"></div>\
		</div>\
		', this.opts));
		this.opts.$parent = $('#' + this.opts.id + ' .modal-body');
		this.$modal = $('#' + this.opts.id);		
	},
	bind_modal_events: function() {
		// focus on first input on show
		var me = this;
		this.$modal.bind('shown', function() {
			me.$form.find(':input:first[type!="hidden"]').focus()
		});	
	},
	show: function(obj) {
		// set values
		this.set_values(this.opts.obj || obj || {})

		// show
		this.$modal.modal('show');
	},
	success: function(data) {
		this._super(data);
		if(!data.error)
			this.$modal.modal('hide');
	}
});