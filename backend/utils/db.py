import pymongo
from utils.config import Config

class Database:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls.client = pymongo.MongoClient(Config.MONGO_URI)
            cls.db = cls.client.get_database() # Uses the DB in the URI (helmet_safety_db)
            print("Connected to MongoDB successfully!")
        return cls._instance

    @property
    def users(self):
        return self.db.users

    @property
    def history(self):
        return self.db.history

    @property
    def alerts(self):
        return self.db.alerts

db = Database()
