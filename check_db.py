import db as stride_db
db = stride_db.get_db()
a = db.analyses.find_one()
print(a.keys())
