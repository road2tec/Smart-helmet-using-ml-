import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_super_secret_key_123')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/helmet_safety_db')
    ALGORITHM = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day
