import session

class PermissionError(Exception): pass
class MandatoryError(Exception): pass

class Model(object):
	mandatory = []
	
	def __init__(self, obj):
		self.obj = obj
			
	def validate(self):
		"""check permissions, mandatory and update timestamp"""
		self.check_allow('post')
		self.check_mandatory()
		import datetime
		self.obj["_updated"] = datetime.datetime.now()

	def before_post(self):
		pass

	def after_post(self):
		pass
	
	def before_get(self):
		pass

	def before_delete(self):
		pass

	def check_allow(self, method):
		"""check allow"""
		if method in ('post','delete'):
			if session.user=='guest':
				raise PermissionError, 'Not allowed'
	
	def check_mandatory(self):
		"""check mandatory"""
		for m in self.mandatory:
			if not self.obj.get(m):
				raise MandatoryError, "%s is mandatory" % m
				
def get(obj):
	"""get model instance for object"""
	if not 'type' in obj:
		return Model(obj)
	try:
		module = __import__('models.' + obj['type'])
	except ImportError:
		try:
			# try in core
			module = __import__('core.' + obj['type'])
		except ImportError:
			return Model(obj)
	
	# find subclass of "Model"
	submodule = getattr(module, obj['type'])
	for name in dir(submodule):
		o = getattr(submodule, name)
		if isinstance(o, type) and issubclass(o, Model):
			return o(obj)
			
	# did not find
	return Model(obj)
	