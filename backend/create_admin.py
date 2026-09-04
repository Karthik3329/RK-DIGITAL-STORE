from datetime import datetime, timezone

from app.database import connect_to_database, get_database
from app.utils.auth import hash_password


ADMIN_EMAIL = "admin@digitalstore.com"
ADMIN_PASSWORD = "Admin@12345"


connect_to_database()
db = get_database()

existing_admin = db.users.find_one({
    "email": ADMIN_EMAIL
})

if existing_admin:
    db.users.update_one(
        {"_id": existing_admin["_id"]},
        {
            "$set": {
                "name": "Store Admin",
                "email": ADMIN_EMAIL,
                "password": hash_password(ADMIN_PASSWORD),
                "role": "admin"
            }
        }
    )

    print("✅ Existing admin updated successfully.")

else:
    db.users.insert_one({
        "name": "Store Admin",
        "email": ADMIN_EMAIL,
        "password": hash_password(ADMIN_PASSWORD),
        "role": "admin",
        "created_at": datetime.now(timezone.utc)
    })

    print("✅ New admin created successfully.")

print()
print("Admin Login")
print("----------------------------")
print(f"Email:    {ADMIN_EMAIL}")
print(f"Password: {ADMIN_PASSWORD}")
print("Role:     admin")