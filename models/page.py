from lib.py import model, common, database
import datetime

db = database.get()

class Page(model.Model):
	_name = 'page'
	_create_table = """
	create table `page` (
		name varchar(180) primary key,
		label varchar(240) not null default "No Label",
		html text,
		markdown text,
		css text,
		js text,
		parent varchar(240),
		idx int(10),
		lft int(10),
		rgt int(10),
		foreign key (parent) references page(name),
		_updated timestamp
	) engine=InnoDB
	"""
	
	def __init__(self, obj):
		super(Page, self).__init__(obj)
	
	def before_get(self):
		"""get list of child pages in `subpage`"""
		self.obj['subpage'] = [d['name'] for d in db.sql("""
			select name from page where parent=%s order by idx""", self.obj['name'])]
		
	def before_post(self):
		"""set parent and idx in child pages"""
		if 'subpage' in self.obj:
			for idx in range(len(self.obj['subpage'])):
				db.sql("""update page set parent=%s, idx=%s, _updated=%s where name=%s""", \
					(self.obj['name'], idx, datetime.datetime.now(), self.obj['subpage'][idx]))
		
			del self.obj['subpage']
		
	
	def after_post(self):
		"""set lft rgt for this and its child nodes"""
		return
		from util import nestedset
		nestedset.remove(self.obj)
		nestedset.add(self.obj)
