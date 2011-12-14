/*<div class="modal hide fade" id="signin">
	<div class="modal-header">
		<a href="#" class="close">&times;</a>
		<h3>Signin</h3>
	</div>
	<div class="modal-body">
		<form class="form-stacked">
			<div class="clearfix">
				<label>User Name</label>
				<input name="user" type="text" />
			</div>
			<div class="clearfix">
				<label>Password</label>
				<input name="password" type="password">
			</div>
			<br><br>
		</form>
	</div>
	<div class="modal-footer">
		<span class="message"></span>
		<button class="btn primary">Sign in</button>
		<button class="btn secondary">Cancel</button>
	</div>
</div>
<script>*/
$.require('lib/js/bootstrap/bootstrap-modal.js');

function LoginView() {
	var me = this;
	$.extend(this, {
		init: function() {
			// make the modal	
			me.make_modal();
			me.bind_events();
		},
		make_modal: function() {
			$.modal_form({
				id: 'login',
				label: "Login",
				method: 'lib.py.session.login',
				fields: [
					{name:'user', label:'User Id'},
					{name:'password', label:'Password', type:'password'},
				],
				btn_primary_label: "Login",
				success: me.success
			});
		},
		success: function(data) {
			// logged in okay
			if(data.message && data.message=='ok') {
				console.log(data);
				$('#signin .message').html(['bingo','howdy','welcome'][$.random(2)])
					.addClass('label success');	
				
				$.session = data;
				$('#signin').modal('hide');
				
			// false login
			} else {
				$('#signin .message').html(['oops','sorry','try again'][$.random(2)] +
					': ' + data.error)
					.addClass('label important');
			}
			$(me).attr('disabled',false);
			
		}
		
		bind_events: function() {
			
		}
	});
	me.init();
}



$('#signin button.btn.secondary').click(function() {
	$('#signin').modal('hide'); 
});

// do the sigin
$('#signin button.btn.primary').click(function() { 
	var params = {}
	
	// validate input
	$('#signin input').each(function() {
		if(!$(this).val()) {
			$(this).parent().addClass('error');
		} else {
			params[$(this).attr('name')] = $(this).val();
		}
	});
		
	params._method = 'lib.py.session.login';

	// check login
	if(params.user && params.password) {
		$(this).attr('disabled',true);
		var me = this;
		$('#signin message').html('Signing in...').addClass('label');
		$.call({
			method:'lib.py.session.login',
			data: params, 
			type: 'POST',
			success: function(data) {
			}
		});
	}
});


// activate as modal
$('#signin').bind('_show', function() {
	$('#signin').modal({backdrop:'static', show:true});
	
	// on show, focus on first element
	$('#signin').bind('shown', function() {
		$('#signin input:first').trigger('focus');
		
		// clear
		$('#signin input').val('');
		
		// clear message
		$('#signin .message').removeClass('success').removeClass('important');
	});
		
	// on hide, trigger login if successful
	$('#signin').bind('hidden', function() {
		if($('#signin .message').hasClass('success')) {
			$(document).trigger('login');
		}
	});
	
	// click on enter
	$('#signin').bind('keydown', function(event) {
		if(event.which==13) {
			$('#signin button.btn.primary').click();
		}
	});
	
	
})