/*
Edit profile
============

usage new EditProfileView().show();
*/

$.require('lib/views/form/modal.js');

var EditProfileView = FormModalView.extend({
	init: function() {
		this._super({
			id: 'editprofile',
			label: "Edit Profile",
			static: {
				type: 'user',
				name: $.session.user
			},
			fields: [
				{name:'fullname', label:'Full Name'},
				{name:'email', label:'Email'},
				{name:'password', label:'Password', type:'password', min_length: 6,
					help:'Must be at least 6 characters'},
				{name:'password_again', label:'Re-type Password', type:'password'},
			],
			method: 'lib.chai.objstore.update',
			obj: $.session.userobj
		});
		this.bind_events();
	},
	bind_events: function() {
		this._super();
		this.inputdict['password_again'].validate = function() {
			$pwd =  $('#editprofile input[name="password"]');
			$pwd1 =  $('#editprofile input[name="password_again"]');
			$pwd1.parent().toggleClass('error', !$pwd.val() || $pwd.val()!=$pwd1.val())
		}
	}
});