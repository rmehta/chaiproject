"""
Module `model`
==============

Model base class and function to get a model-object from an object.

The model object is used to
1. Define the schema using create table
2. Declare events that will be called by objstore before or after "get", "insert", "update", "delete"
3. Declare basic permission rules by overriding the method "check_allow"
4. Any other utility methods

Models are usually saved in modules in the sub-directory "models". Core models, that are supplied
with the framework are saved in "lib/py/core"

Events
------

Standard Events are:

1. "before_get"
2. "before_insert"
3. "before_update"
4. "before_delete"
5. "after_insert"
6. "after_update"
7. "after_delete"
8. "check_allow"

"""
core_types = ['_parent_child', 'page', 'user', 'session', 'userrole']

class PermissionError(Exception): pass

class Model(object):
	mandatory = []
	
	def __init__(self, obj):
		self.obj = obj
				
	def validate(self):
		"""check permissions, mandatory and update timestamp"""
		self.check_allow('post')
		import datetime
		self.obj["_updated"] = datetime.datetime.now()

	def before_get(self): pass
	def before_insert(self): pass
	def before_update(self): pass
	def before_delete(self): pass
	def after_insert(self): pass
	def after_update(self): pass
	def after_delete(self): pass

	def check_allow(self, method):
		"""check allow"""
		from lib.py import sess
		
		# for session types, there is no session defined
		# (yet)
		if self.obj['type']=='session':
			return
			
		if method in ('insert','update','delete'):
			if sess['user']=='guest':
				raise PermissionError, 'Not allowed'

def get(obj):
	"""get model instance for object"""
	import sys
	
	if not 'type' in obj:
		return Model(obj)
		
	if obj['type'] in core_types:
		modulepackage = 'lib.py.core.' + obj['type']		
	else:
		modulepackage = 'models.' + obj['type']

	__import__(modulepackage)

	# find subclass of "Model"
	modelclass = model_class(sys.modules[modulepackage])
	if modelclass: 
		return modelclass(obj)
	else:
		raise Exception, 'Model for %s not found' %  obj['type']

def model_class(moduleobj):
	"""find first subclass of model.Model"""
	for name in dir(moduleobj):
		attr = getattr(moduleobj, name)
		if isinstance(attr, type) and issubclass(attr, Model):
			return attr
			
def all():
	"""get all model objects from 'core' and 'models' folders"""
	import os
	from lib.py import common
	
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