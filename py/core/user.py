import model

class User(model.Model):
	def __init__(self, obj):
		super(User, self).__init__(obj)
		
	def before_post(self):
		"""save password as sha256 hash"""		
		import hashlib
		if 'password' in self.obj and len(self.obj['password'])!=64:
			self.obj['password'] = hashlib.sha256(self.obj['password']).hexdigest()
		
		# clear re-entered password
		if 'password_again' in self.obj:
			del self.obj['password_again']
			
	def before_get(self):
		"""hide password"""
		if 'password' in self.obj:
			del self.obj['password']