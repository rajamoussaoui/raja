from datetime import datetime
from pymongo import IndexModel, ASCENDING

def init_models(db):
    class Conversation:
        collection = db.conversations

        @classmethod
        def create(cls, user_id):
            return cls.collection.insert_one({
                'user_id': user_id,
                'created_at': datetime.utcnow(),
                'messages': []
            })

        @classmethod
        def add_message(cls, conversation_id, sender, content):
            return cls.collection.update_one(
                {'_id': conversation_id},
                {'$push': {
                    'messages': {
                        'sender': sender,
                        'content': content,
                        'timestamp': datetime.utcnow()
                    }
                }}
            )

        @classmethod
        def get_user_conversations(cls, user_id):
            return list(cls.collection.find(
                {'user_id': user_id},
                sort=[('created_at', -1)]
            ))

    # Create indexes
    db.conversations.create_indexes([
        IndexModel([('user_id', ASCENDING)]),
        IndexModel([('created_at', ASCENDING)])
    ])
    
    return Conversation