$.require('lib/views/form/form.js');

var EditProfileView = Class.extend({
	init: function() {
		this.make_modal();
		this.bind_events();
	},
	make_modal: function() {
		this.modal = new FormModalView({
			id: 'editprofile',
			label: "Edit Profile",
			static: {
				type: 'user',
				name: $.session.user;
			},
			fields: [
				{name:'fullname', label:'Full Name'},
				{name:'email', label:'Email'},
				{name:'password', label:'Password', type:'password', min_length: 6,
					help:'Must be at least 6 characters'},
				{name:'password_again', label:'Re-type Password', type:'password'},
			],
			method: 'lib.py.objstore.update'
		})
	},
	bind_events: function() {
		this.modal.inputdict['password_again'].validate = function() {
			$pwd =  $('#editprofile input[name="password"]');
			$pwd1 =  $('#editprofile input[name="password_again"]');
			$pwd1.parent().toggleClass('error', !$pwd.val() || $pwd.val()!=$pwd1.val())
		}
	}
});