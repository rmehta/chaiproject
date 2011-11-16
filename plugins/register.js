$.require('lib/js/form.js');

// make the modal-form
(function() {
	$.modal_form({
		id: 'register',
		label: "Register",
		fields: [
			{
				name:'type', 
				type:'hidden', 
				defaultval:'user'
			},
			{
				name:'_new', 
				type:'hidden', 
				defaultval:'1'
			},
			{
				name:'name', 
				label:'Username',
				help:'No spaces or special characters', 
				min_length:6,
				no_special: true
			},
			{
				name:'password', 
				label:'Password', 
				type:'password',
				help:'Must be at least 6 characters', 
				min_length:6
			},
			{
				name:'email', 
				label:'Email', 
				help:'Incase you forget your password',
				data_type:'email'
			}
		]
	});
})();

$('#register').bind('hidden', function() {
	window.history.back();
});

// check if all data is correct
// and then enable the register button
//$('#register .btn.primary').click()

$('#register').bind('_show', function() {
	$('#register form').set_values({});
	$('#register').modal('show');
})