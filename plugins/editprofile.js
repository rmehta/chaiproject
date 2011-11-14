$.require('lib/js/form.js');

// make the modal-form
(function() {
	$.modal_form({
		id: 'editprofile',
		label: "Edit Profile",
		fields: [
			{name:'type', type:'hidden', value:'user'},
			{name:'name', type:'hidden'},
			{name:'full_name', label:'Full Name'},
			{name:'email', label:'Email'},
			{name:'password', label:'Password', type:'password',
				help:'Must be at least 6 characters'},
			{name:'password_again', label:'Re-type Password', type:'password'},
		]
	});
})();


// password check
(function() {
	checkpassword = function() {
		$pwd =  $('#editprofile input[name="password"]');
		$pwd1 =  $('#editprofile input[name="password_again"]');
		
		$pwd.parent().toggleClass('error', $pwd.val().length < 6)
		$pwd1.parent().toggleClass('error', !$pwd.val() || $pwd.val()!=$pwd1.val())

		$('#editprofile button.btn.primary').attr('disabled',
			$('#editprofile .error').length ? true : false);
	}

	$('#editprofile input').keyup(checkpassword);
})()

// on-show
$('#editprofile').bind('show', function() {
	$.objstore.get('user', $.session.user, function(obj) {
		$('#editprofile form').set_values(obj)
	})
});

$('#editprofile').bind('hidden', function() {
	window.history.back();
});

$('#editprofile').modal('show');

