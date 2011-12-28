"""
Controllers for user management
"""

from lib.chai import whitelist, db, objstore, model

@whitelist(allow_guest=True)
def forgot_password(**args):
	"""email the user with a unique link to generate the password"""	
	user = db.sql("""select name from user where name=%s or email=%s""", (args['email'], args['email']))
	if not user:
		return 'No such user'
		
	userobj = model.get(objstore.get(type="user", name=user[0]['name']))
	userobj.request_reset_password()
	return 'ok'
	
@whitelist(allow_guest=True)
def get_user_fullname(**args):
	"""get user fullname"""
	ret = db.sql("""
		select ifnull(fullname, name) as fullname 
		from user where reset_password_id=%s""", args['requestid'])
	if ret:
		return ret[0]['fullname']
	else:
		return 'bad id'
		
@whitelist(allow_guest=True)
def update_password(**args):
	"""update user password"""
	userobj = model.get(dict(type="user", name="any"))
	db.sql("""update user set password=%s, reset_password_id=NULL
		where reset_password_id=%s""", \
		(userobj.encrypt_password(args['password']), args['requestid']))

	return 'ok'
	