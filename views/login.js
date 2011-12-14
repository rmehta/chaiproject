/*
LoginView
=========

To call,

app.login();

*/

$.require('lib/js/bootstrap/bootstrap-modal.js');
$.require('lib/views/form/modal.js');

var LoginView = Class.extend({
	init: function() {
		// make the modal	
		this.make_modal();
	},
	make_modal: function() {
		this.modal = new FormModalView({
			id: 'login',
			label: "Login",
			method: 'lib.py.session.login',
			fields: [
				{name:'user', label:'User Id',mandatory:true},
				{name:'password', label:'Password', type:'password',mandatory:true},
			],
			btn_primary_label: "Login",
			success: function(data) {
				if(data.message && data.message == 'ok') {
					$.session = data;
					$(document).trigger('login');
				}
			}
		});
	},
	show: function() {
		this.modal.show();
	}
});
