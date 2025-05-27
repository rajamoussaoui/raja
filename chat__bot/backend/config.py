import os
from pymongo import MongoClient

class Config:
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    DB_NAME = 'chatbot_db'
    
    @staticmethod
    def init_app(app):
        app.mongo_client = MongoClient(Config.MONGO_URI)
        app.db = app.mongo_client[Config.DB_NAME]  # This creates the 'db' attribute