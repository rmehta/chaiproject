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

- "before_get"
- "before_post"
- "before_insert"
- "before_update"
- "before_delete"
- "after_post"
- "after_insert"
- "after_update"
- "after_delete"
- "check_allow"
- "validate"

"""
import conf

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

	def execute(self, method):
		if hasattr(self, method):
			getattr(self, method)()

	def check_allow(self, method):
		"""check allow"""
		from lib.chai import sess
		
		# for session types, there is no session defined
		# (yet)
		if self.obj['type']=='session':
			return
			
		if method in ('insert','update','delete'):
			if sess['user']=='guest':
				raise PermissionError, 'Not allowed'

def get(obj):
	"""get model instance for object"""
	import sys, conf
	from lib.chai import core_models, site
	
	if not 'type' in obj:
		return Model(obj)
		
	if obj['type'] in core_models:
		modulepackage = 'lib.models.' + str(obj['type'])
	else:
		modulepackage = conf.sites[site]['path'] + '.models.' + str(obj['type'])

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
	from lib.chai import common, modelpath
	
	common.update_path()
	dr = common.directory_root()
	ml = find_models(modelspath(), 'models')
	ml += find_models('lib/models', 'models')
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