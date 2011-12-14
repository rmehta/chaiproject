"""
Manage sessions

1. Loads session / start a new session at the beginning of a request
2. Login
3. Logout

Methods:
--------

### new_guest

start a new guest session

### new_sid

return a new sid hash

### login (whitelist)

login - requires form variables user and password.

### logout (whitelist)

logout - delete all sessions of this user
"""

user = None

from lib.py import whitelist, database, objstore

@whitelist()
def load(**args):
	"""load an existing sesion from cookies or start a new guest session"""
	from lib.py import req, res
	
	db = database.get()
	
	if 'sid' in req.cookies and req.cookies['sid']!='guest':
		sess = objstore.get(type='session', name=req.cookies['sid'])
		if sess:
			sess['userobj'] = objstore.get(type='user', name=sess['user'])
			return sess
	
	# no session, start a new one as guest (no need to save)
	sess = dict(type='session', name='guest', user='guest')	
	return sess
	
def new_sid():
	"""set new sid"""
	import hashlib, time
	return hashlib.sha224(str(time.time())).hexdigest()

@whitelist(allow_guest=True)
def login(**args):
	"""login"""
	from lib.py import res
	db = database.get()
	
	import hashlib
	pwd = db.sql("select password from user where name=%s", (args['user'],))
	if pwd: 
		pwd = pwd[0]['password']
	
	if pwd == hashlib.sha256(args.get("password")).hexdigest():
		d = dict(type='session', name=new_sid(), user=args['user'])
		objstore.insert(**d)
		res.set_cookie('sid', d['name'])
		d.update({"message":"ok", "userobj":objstore.get(type='user', name=args['user'])})
		return d
	else:
		return {"error":"Invalid Login"}

@whitelist()
def logout(**args):
	"""logout"""
	from lib.py import req
	db = database.get()
	user = db.sql("""select user from session where name=%s""", req.cookies['sid'])[0]['user']
	db.sql("delete from session where user=%s", user)