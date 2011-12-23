"""
Sub-pages of this topic
(each page is a topic and a page)
"""

from lib.py import model

class SubPage(model.Model):
	_name = 'subpage'
	_parent = 'page'
	_create_table = """
	create table `subpage` (
		parent varchar(240) not null,
		parent_type varchar(240) not null,
		value varchar(240) not null,
		idx int(8),
		unique(parent, parent_type, idx)
	) engine=InnoDB
	"""