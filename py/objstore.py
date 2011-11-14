#!/usr/bin/python
import http_request, model

db = None

class ObjStore:
	def __init__(self, req=None):
		global db
		if req:
			self.req = req
			self.db = req.db
		else:
			if not db:
				import database
				db = database.Database()
				self.db = db

		self.sql = self.db.sql
		
	def get(self, ttype, name):
		"""get an object"""
		import sqlite3
		obj = {"type":ttype, "name":name}
		try:
			obj = self.sql("select * from `%s` where name=?" % ttype, (name,), as_dict=1)
			if obj:
				obj = obj[0]
			else:
				return {}
			self._get_children(obj, ttype, name)
			
		except sqlite3.OperationalError, e:
			if "no such table" in e.args[0]:
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
		for child_tab in self.sql("select child from _parent_child where parent=?", (ttype,)):
			obj_list = self.sql("""select * from `%s` where parent=? and parent_type=?""" \
				% child_tab[0], (name, ttype), as_dict=1)
			obj[child_tab[0]] = []
			for child in obj_list:
				del child['parent']
				del child['parent_type']
				if len(child.keys())==1 and 'value' in child:
					obj[child_tab[0]].append(child['value'])
				else:
					obj[child_tab[0]].append(child)
									
	def update_table(self, obj):
		"""adapt the table to the object"""
		cols = [c["name"] for c in self.sql("pragma table_info(%s)" % obj["type"], as_dict=1)]
		for key in obj:
			if key is not 'type' and key not in cols:
				self.add_column(obj['type'], key)

	def add_column(self, tab, column):
		"""returns true if column exists"""
		self.sql("""alter table `%s` add column `%s`""" % (tab, column))

	def add_constraint(self, tab, constraint):
		"""add constraints / indexs to the table"""
		if 'unique' in constraint:
			self.sql("""create unique index if not exists %s on `%s` (%s)""" \
				% (constraint['unique'].replace(',', '_').replace(' ',''), tab, \
					constraint['unique']))

	def create_table(self, obj, constraint):
		"""create a table"""
		
		name_def = 'name primary key,'
		columns = obj.keys()
		columns.remove("type")
		if 'name' in columns:
			columns.remove('name')
			
		if not columns:
			self.sql("""create table `%s` (name primary key)""" % obj['type'])
		else:
			query = ("""create table `%(tab)s` (%(name_def)s %(cols)s)""" % {
				"tab": obj['type'],
				"name_def": (('parent' not in columns) and name_def or ''),
				"cols": ('`%s`,'*len(columns))[:-1]
			}) % (len(columns)==1 and columns[0] or tuple(columns))
			self.sql(query)
			
		if 'parent_type' in obj:
			self.post({"type":"_parent_child", "parent":obj["parent_type"], "child":obj["type"]}, \
				constraint = {"unique":"parent, child"});
				
		if constraint:
			self.add_constraint(obj['type'], constraint)

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

	def post(self, obj, constraint={}):
		"""post a vector object, the property name is the type. see test case for example"""

		modelobj = (not obj.get('parent_type')) and model.get(obj) or None
		
		# delete if exists
		if obj.get("type") and obj.get("name"):
			self.delete(obj["type"], obj["name"])

		modelobj and modelobj.before_post()
		modelobj and modelobj.validate()
				
		obj_single, is_vector = self._get_single(obj)
		# save the parent
		self.post_single(obj_single, constraint)
		if is_vector:			
			for k in obj:
				d = {"type":k, "parent":obj["name"], "parent_type":obj["type"]}
				# dict, one child only
				if type(obj[k]) is dict:
					obj[k].update(d)
					self.post(obj[k])
				
				# multiple children
				if type(obj[k]) in (list, tuple):
					for child in obj[k]:
						
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


	def post_single(self, obj, constraint={}):
		"""post an object, create and alter tables on the fly"""
		import sqlite3
		obj_copy = obj.copy()
		del obj_copy['type']

		try:
			self.sql("""insert or replace into `%(tab)s`(`%(cols)s`) values (%(vals)s)""" % {
				'tab': obj['type'],
				'cols': '`, `'.join(obj_copy.keys()),
				'vals': ('?,'*len(obj_copy))[:-1]
			}, obj_copy.values())
		except sqlite3.OperationalError, e:
			if 'no such table' in e.args[0]:
				self.create_table(obj, constraint)
				self.post_single(obj)
				return
			if 'has no column named' in e.args[0]:
				self.update_table(obj)
				self.post_single(obj)
				return
			else:
				raise e
	
	def delete(self, ttype, name):
		"""delete an object and its children"""
		import sqlite3

		try:
			model.get({"type":ttype, "name":name}).check_allow('delete')
			self.sql("""delete from `%s` where name=?""" % ttype, (name,))

			# delete children
			for child_tab in self.sql("select child from _parent_child where parent=?", (ttype,)):
				self.sql("""delete from `%s` where parent=? and parent_type=?""" \
					% child_tab[0], (name, ttype), as_dict=1)
		except sqlite3.OperationalError, e:
			if 'no such table' in e.args[0]:
				return
			else:
				raise e			
	
	
def post(**args):
	"""
	post (insert or replace) an object
	uniqueness can be identified by name or by constraint = {"unique":"c1, c2"}
	"""
	if 'json' in args:
		ObjStore(http_request.req).post(args['json'])
		return {'message':'ok'}
	elif 'type' in args:
		ObjStore(http_request.req).post(args)
		return {'message':'ok'}
	else:
		return {'error':'post must either have "json" or "type" parameters'}

def get(**args):
	"""get an obj by type,name"""
	return ObjStore(http_request.req).get(args['type'], args['name'])

def delete(**args):
	"""get an obj by type,name"""
	ObjStore(http_request.req).delete(args['type'], args['name'])
	return {'message':'ok'}

# request handling
if __name__=="__main__":
	http_request.main()
