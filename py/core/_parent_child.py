"""
maintain list of parent-child relation
"""

import model

class ParentChild(model.Model):
	_name = '_parent_child'
	_create_table = """
	create table `_parent_child` (
		parent varchar(240) not null,
		child varchar(240) not null,
		_updated timestamp,
		unique parent_child (parent, child)
	) engine=InnoDB
	"""