import db as stride_db
from api import build_map_html

db = stride_db.get_db()
analyses = list(db.analyses.find({"map_html": {"$exists": False}}))
for a in analyses:
    try:
        lat = a.get("lat")
        lon = a.get("lon")
        traj_points = a.get("traj_points", [])
        cone_polygon = a.get("cone", [])
        pred_vmax = a.get("pred_vmax", 0)
        if traj_points and lat is not None:
            html = build_map_html(lat, lon, traj_points, cone_polygon, pred_vmax)
            db.analyses.update_one({"_id": a["_id"]}, {"$set": {"map_html": html}})
            print(f"Updated {a['_id']}")
    except Exception as e:
        print(f"Error on {a['_id']}: {e}")
print(f"Processed {len(analyses)} records.")
