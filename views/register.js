/*
RegisterView
============

Usage:
new RegisterView().modal.show();
*/

$.require('lib/views/form/modal.js');

RegisterView = Class.extend({
	init: function() {
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
		
		this.modal = new FormModalView({
			id: 'register',
			label: "Register",
			static: {
				type:'user'
			}
			fields: register_fields,
			success: function(data) {
				// login after registration
				if(data.message=='ok') {
					$.call({
						method:'lib.py.session.login',
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
			}
		});
	}
}