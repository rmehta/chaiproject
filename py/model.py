import session, common

class PermissionError(Exception): pass
class MandatoryError(Exception): pass

class Model(object):
	mandatory = []
	
	def __init__(self, obj):
		self.obj = obj
				
	def validate(self):
		"""check permissions, mandatory and update timestamp"""
		self.check_allow('post')
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

def get(obj):
	"""get model instance for object"""
	if not 'type' in obj:
		return Model(obj)
	try:
		module = __import__('models.' + obj['type'])
	except ImportError, e:
		common.log("unable import %s (%s)" % (obj['type'], str(e)))
		try:
			# try in core
			module = __import__('core.' + obj['type'])
		except ImportError, e:
			return Model(obj)
	
	# find subclass of "Model"
	modelclass = model_class(getattr(module, obj['type']))
	if modelclass: 
		return modelclass(obj)
	else:
		# did not find
		return Model(obj)

def model_class(moduleobj):
	"""find first subclass of model.Model"""
	for name in dir(moduleobj):
		attr = getattr(moduleobj, name)
		if isinstance(attr, type) and issubclass(attr, Model):
			return attr
			
def all():
	"""get all model objects from 'core' and 'models' folders"""
	import os, common
	common.update_path()
	dr = common.directory_root()
	ml = find_models(os.path.join(dr, 'models'), 'models')
	ml += find_models(os.path.join(dr, 'lib/py/core'), 'core')
	return filter(lambda x: x, ml)

def find_models(path, package):
	"""find models from this folder"""
	models = []
	import os
	for fname in os.listdir(path):
		if fname.endswith('.py'):
			modulename = fname[:-3]
			if not modulename.startswith('__'):
				moduleobj = __import__(package + '.' + modulename)
				moduleobj = getattr(moduleobj, modulename)
				models.append(model_class(moduleobj))
	return models	