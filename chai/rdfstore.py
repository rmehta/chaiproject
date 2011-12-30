"""
	Triple `Store`:
	
	KISS Store for triples in table `rdf_triple`, modeled on `rdflib`
	http://www.rdflib.net/rdflib-2.4.0/html/index.html
	
Methods:

get(obj)
insert(obj)
update(obj)
delete(obj)
"""

from lib.chai import db, whitelist

class Store:
	def __init__(self):
		pass
	
	def add(self, triples):
		"""Write a list of triples in the store"""
		for t in triples:
			db.sql("""
				insert ignore into rdf_triple(subject, predicate, object) 
				values (%s, %s, %s)""", (t[0], t[1], t[2]))
		
	def get_matching_conditions(self, s, p, o):
		"""Returns matching sql conditions and values"""
		cond, values = [], []
		if s: 
			cond.append('`subject`=%s')
			values.append(s)
		if p: 
			cond.append('`predicate`=%s')
			values.append(p)
		if o: 
			cond.append('`object`=%s')
			values.append(o)
		
		if not cond:
			raise Exception, 'Some filter is necessary'
		
		return cond, values
					
	def remove(self, s, p, o):
		"""Remove matching triples"""
		cond, values = self.get_matching_conditions(s, p, o)
		return db.sql("""delete from rdf_triple where %s""" % \
			' and '.join(cond), values)

	def triples(self, s, p, o=None):
		"""Return matching triples"""
		cond, values = self.get_matching_conditions(s, p, o)
		return db.sql("""select `subject`, `predicate`, `object` 
			from rdf_triple where %s""" % ' and '.join(cond), values, as_dict=False)
	
	def get(self, s):
		"""return object of given name"""
		nt = self.triples(s, None, None)
		d = {}
		for t in nt:
			s, p, o = t
			if p in d:
				if type(d[p]) is not list:
					d[p] = [d[p],]
				d[p].append(o)
			else:
				d[p] = o
		return d

	def update(self, obj):
		"""save an object"""
		for key in obj:
			self.add(((obj['name'], key, obj[key],),))

	def ancestors(self, subject):
		"""Get ancestors based on subClassOf property, beginning with the oldest"""
		al = [subject]
		for a in al:
			superclasses = [a[2] for a in self.triples(a, 'subClassOf')]
			for s in superclasses:
				if s not in al:
					al.append(s)
			
		al.reverse()
		return al
		
@whitelist()
def get(**args):
	"""get by name"""
	return Store().get(args['name'])

@whitelist()
def insert(**args):
	if '_method' in args:
		del args['_method']
		
	store = Store()
	if store.triples(args['name']):
		raise Exception, '[rdfstore] Object Exists'
	store.update(args)
	return {'message':'ok'}

@whitelist()
def update(**args):
	if '_method' in args:
		del args['_method']
		
	store = Store()
	store.remove(args['name'], None, None)
	store.update(args)
	return {'message':'ok'}

@whitelist()
def delete(**args):
	Store().remove(args['name'], None, None)
	return {'message':'ok'}
	