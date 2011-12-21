from lib.py import model

reset_email_message = """
Forgot Password
---------------

Hello %(fullname)s,

To reset your password [click here](%(url)s)

Or copy-paste this url to your address bar:

%(url)s

If you did not request to reset your password, ingore this mail.

Nice Day!

(System Generated Message)
"""

class User(model.Model):
	_name = 'user'
	_create_table = """
	create table `user` (
		name varchar(180) primary key,
		fullname varchar(240),
		email varchar(180),
		password varchar(100),
		reset_password_id varchar(100),
		_updated timestamp
	) engine=InnoDB
	"""	
	
	def __init__(self, obj):
		super(User, self).__init__(obj)
		
	def before_insert(self):
		"""save password as sha256 hash"""		
		if 'password' in self.obj:
			self.obj['password'] = self.encrypt_password(self.obj['password']) 
		
		# clear re-entered password
		if 'password_again' in self.obj:
			del self.obj['password_again']
	
	def encrypt_password(self, raw):
		"""encrypt password"""
		import hashlib
		if len(raw)==64:
			return raw
		else:
			return hashlib.sha256(raw).hexdigest()			
		
	def before_update(self):
		self.before_insert()
	
	def before_get(self):
		"""hide password"""
		if 'password' in self.obj:
			del self.obj['password']
	
	def request_reset_password(self):
		"""generate a reset password id and mail the password to the user"""
		import hashlib, time
		from lib.py import database, emailer
		import conf
		
		db = database.get()
		resetid = hashlib.sha224(str(time.time())).hexdigest()
		db.setvalue('user', self.obj['name'], 'reset_password_id', resetid)
		
		d = {
			'fullname': self.obj.get('fullname',None) or self.obj['name'],
			'url': conf.app_url + '#reset_password/' + resetid
		}
		
		emailer.send(recipients=[self.obj['email']], subject="Password Reset",
		 	message=reset_email_message % d)
		
		
