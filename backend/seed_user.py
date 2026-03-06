import bcrypt

def generate_admin():
    email = "harshal@bajaj.com"
    password = "admin123"
    full_name = "Harshal Admin"
    role = "admin"

    # 1. Convert password to bytes
    password_bytes = password.encode('utf-8')

    # 2. Generate a salt and hash it
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)

    # 3. Decode back to string for MySQL
    hashed_str = hashed_password.decode('utf-8')

    print("\n--- COPY AND PASTE INTO MYSQL ---")
    print(f"Email: {email}")
    print(f"Full Name: {full_name}")
    print(f"Hashed Password: {hashed_str}")
    print(f"Role: {role}")
    print("---------------------------------\n")

if __name__ == "__main__":
    generate_admin()