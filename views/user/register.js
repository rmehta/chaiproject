/*
RegisterView
============

Usage:
new RegisterView().show();
*/

$.require('lib/views/form/modal.js');

RegisterView = FormModalView.extend({
	init: function() {
		var me = this;
		var register_fields = [
			{
				name:'name', label:'Username',
				help:'No spaces or special characters', 
				min_length:6, no_special: true
			},
			{
				name:'password',  label:'Password', type:'password',
				help:'Must be at least 6 characters', 
				min_length:6
			},
			{
				name:'email', label:'Email', data_type:'email',
				help:'Incase you forget your password'
			}
		]
		
		this._super({
			id: 'register',
			label: "Register",
			static: { type:'user' },
			fields: register_fields,
			primary_btn_label: "Register",
			primary_btn_working_label: "Registering...",
			success: function(data) {
				// login after registration
				if(data.message=='ok') me.login_after_register();
			}
		});
	},
	login_after_register: function() {
		$.call({
			method:'lib.chai.session.login',
			type: 'POST', 
			data: {
				user: $('#register input[name="name"]').val(), 
				password: $('#register input[name="password"]').val()
			}, 
			success: function(session) {
				if(session.message=='ok') {
					$.session = session
					// trigger login
					$(document).trigger('login');								
				} else {
					alert('[register] did not login');
				}
			}
		});		
	}
});