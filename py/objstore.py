#!/usr/bin/python

"""
Objectstore add, update and remove objects from the db

Methods:

get
post
delete

Takes db connection from the session (if present) or opens a new connection from the conf
"""
import http_request, model, MySQLdb
import MySQLdb.constants.ER as ER


class ObjStore:
	def __init__(self):
		import database
		self.db = database.get()
		
	def get(self, ttype, name):
		"""get an object"""
		import sqlite3
		obj = {"type":ttype, "name":name}
		try:
			obj = self.db.sql("select * from `%s` where name=%s" % (ttype, '%s'), 
				(name,), as_dict=1)
			if obj:
				obj = obj[0]
			else:
				return {}
			self._get_children(obj, ttype, name)
			
		except MySQLdb.Error, e:
			if e.args[0]==ER.NO_SUCH_TABLE:
				pass
			else:
				raise e
				
		obj['type'] = ttype

		modelobj = model.get(obj) or None
		modelobj and modelobj.check_allow('get')
		modelobj and modelobj.before_get()
	
		return obj
	
	def _get_children(self, obj, ttype, name):
		"""get children rows"""
		for child_tab in self.db.sql("select child from _parent_child where parent=%s", 
			(ttype,)):
			childtype = child_tab['child']
			obj_list = self.db.sql("""select * from `%s` where parent=%s and parent_type=%s order by idx asc""" \
				% (childtype,'%s','%s'), (name, ttype))
			obj[childtype] = []
			for child in obj_list:
				del child['parent']
				del child['parent_type']
				del child['idx']

				if len(child.keys())==1 and 'value' in child:
					obj[childtype].append(child['value'])
				else:
					obj[childtype].append(child)

	def _get_single(self, obj):
		"""filter vector properties"""
		s = {}
		is_vector = False
		for k in obj:
			if type(obj[k]) not in (list, tuple, dict):
				s[k] = obj[k]
			else:
				is_vector = True
		return s, is_vector

	def post(self, obj):
		"""post a vector object, the property name is the type. see test case for example"""

		modelobj = (not obj.get('parent_type')) and model.get(obj) or None
		modelobj and modelobj.before_post()
		modelobj and modelobj.validate()
				
		obj_single, is_vector = self._get_single(obj)
		# save the parent
		self.post_single(obj_single)
		if is_vector:	
			for k in obj:
				d = {"type":k, "parent":obj["name"], "parent_type":obj["type"]}
				# dict, one child only
				if type(obj[k]) is dict:
					obj[k].update(d)
					self.post(obj[k])
				
				# multiple children
				if type(obj[k]) in (list, tuple):
					idx = 0
					for child in obj[k]:
						d['idx'] = idx
						idx += 1
						
						# child is a dict
						if type(child) is dict:
							child.update(d)
							self.post(child)
							
						# child is literal (only names)
						elif type(child) in (str, int, float):
							c = {"value":child}
							c.update(d)
							self.post_single(c)
						else:
							raise Exception, "child %s must be dict or literal" % str(child)	
		modelobj and modelobj.after_post()

	def exists(self, obj):
		"""check exists by name"""
		if obj.get('name') and obj.get('type'):
			return self.db.sql("select name from `%s` where name=%s" % \
			 	(obj['type'],'%s'), obj['name'])

	def post_action(self, obj):
		"""identify post action"""
		if obj.get('_new'):
			return 'insert'
		elif obj.get('_replace'):
			return 'replace'
		elif not obj.get('name'):
			return 'replace'
		elif not self.exists(obj):
			return 'replace'
		else:
			return 'update'

	def post_single(self, obj):
		"""post an object in db, ignore extra columns"""
		import MySQLdb
		obj_copy = {}
		
		columns = self.db.columns(obj['type'])
		# copy valid columns
		for c in columns:
			if obj.get(c):
				obj_copy[c] = obj.get(c)

		parts = {
			'tab': obj['type'],
			'cmd': self.post_action(obj)
		}

		if parts['cmd'] in ('insert', 'replace'):
			parts['cols'] = '`, `'.join(obj_copy.keys())
			parts['vals'] = ('%s,'*len(obj_copy))[:-1]
			query = """%(cmd)s into `%(tab)s`(`%(cols)s`) 
				values (%(vals)s)""" % parts
		else:
			parts['set'] = ', '.join(['`%s`=%s' % (key, '%s') for key in obj_copy.keys()])
			parts['name'] = obj['name'].replace("'", "\'")
			query = """update `%(tab)s` set %(set)s where name='%(name)s'""" % parts
		
		self.db.sql(query, tuple(obj_copy.values()))
	
	def delete(self, ttype, name):
		"""delete an object and its children"""
		try:
			model.get({"type":ttype, "name":name}).check_allow('delete')
			self.db.sql("""delete from `%s` where name=%s""" % (ttype, '%s'), name)

			# delete children
			for child_tab in self.db.sql("select child from _parent_child where parent=%s", (ttype,)):
				self.db.sql("""delete from `%s` where parent=%s and parent_type=%s""" \
					% (child_tab['child'],'%s','%s'), (name, ttype))
		except MySQLdb.Error, e:
			if e.args[0] == ER.NO_SUCH_TABLE:
				return
			else:
				raise e
	
_objstore = None
	
def post(**args):
	"""
	post (insert or replace) an object
	uniqueness can be identified by name or by constraint = {"unique":"c1, c2"}
	"""
	global _objstore
	_objstore = _objstore or ObjStore()
	
	if 'json' in args:
		_objstore.post(args['json'])
		return {'message':'ok'}
	elif 'type' in args:
		_objstore.post(args)
		return {'message':'ok'}
	else:
		return {'error':'post must either have "json" or "type" parameters'}

def get(**args):
	"""get an obj by type,name"""
	global _objstore
	_objstore = _objstore or ObjStore()

	return _objstore.get(args['type'], args['name'])

def delete(**args):
	"""get an obj by type,name"""
	global _objstore
	_objstore = _objstore or ObjStore()

	_objstore.delete(args['type'], args['name'])
	return {'message':'ok'}

# request handling
if __name__=="__main__":
	http_request.main()
