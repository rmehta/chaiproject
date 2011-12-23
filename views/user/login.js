/*
LoginView
=========

Usage:
new LoginView().modal.show();
*/

$.require('lib/views/form/modal.js');

var LoginView = FormModalView.extend({
	init: function() {
		// make the modal	
		this._super({
			id: 'login_view',
			label: "Login",
			method: 'lib.py.session.login',
			fields: [
				{name:'user', label:'User Id',mandatory:true},
				{name:'password', label:'Password', type:'password',mandatory:true},
				{type:'html', content:'<p><a href="#forgot_password">Forgot Password?</a></p>'}
			],
			primary_btn_label: "Login",
			primary_btn_working_label: "Logging In...",
			submit_from_last_input: true,
			success: function(data) {
				if(data.message && data.message == 'ok') {
					$.session = data;
					$(document).trigger('login');
				}
			}
		});
	},
});
