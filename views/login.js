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
			btn_primary_label: "Login",
			success: function(data) {
				if(data.message && data.message == 'ok') {
					$.session = data;
					$(document).trigger('login');
				}
			}
		});
	},
});
