from datetime import datetime, timezone

from app.database import connect_to_database, get_database
from app.utils.auth import hash_password, verify_password


ADMIN_EMAIL = "admin@digitalstore.com"
ADMIN_PASSWORD = "Admin@12345"


print("Connecting to database...")

connect_to_database()
db = get_database()

new_password_hash = hash_password(ADMIN_PASSWORD)

existing_admin = db.users.find_one({
    "email": ADMIN_EMAIL
})

if existing_admin:

    db.users.update_one(
        {
            "_id": existing_admin["_id"]
        },
        {
            "$set": {
                "name": "Store Admin",
                "email": ADMIN_EMAIL,
                "password": new_password_hash,
                "role": "admin",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    print("✅ Existing admin account updated.")

else:

    db.users.insert_one({
        "name": "Store Admin",
        "email": ADMIN_EMAIL,
        "password": new_password_hash,
        "role": "admin",
        "created_at": datetime.now(timezone.utc)
    })

    print("✅ New admin account created.")


# Verify password immediately
admin = db.users.find_one({
    "email": ADMIN_EMAIL
})

password_ok = verify_password(
    ADMIN_PASSWORD,
    admin["password"]
)

print()
print("================================")
print("ADMIN LOGIN DETAILS")
print("================================")
print(f"Email:    {ADMIN_EMAIL}")
print(f"Password: {ADMIN_PASSWORD}")
print(f"Role:     {admin['role']}")
print(f"Password verification: {password_ok}")
print("================================")

if password_ok:
    print("✅ Admin password is working correctly.")
else:
    print("❌ Password verification failed.")