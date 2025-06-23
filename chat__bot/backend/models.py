from datetime import datetime
from pymongo import IndexModel, ASCENDING, DESCENDING
from bson import ObjectId
import re

def clean_text(text):
    """Clean and normalize text for consistent formatting"""
    if not text:
        return ""
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.replace("Ã©", "é").replace("Ã¨", "è")
    text = text.replace("Ãª", "ê").replace("Ãç", "ç")
    return text

def init_models(db):
    class Conversation:
        collection = db.conversations
        responses_collection = db.responses

        @classmethod
        def create(cls, user_id, norme, description):
            conversation_data = {
                'user_id': user_id,
                'norme': norme,
                'description': clean_text(description),
                'created_at': datetime.utcnow(),
                'last_updated': datetime.utcnow(),
                'status': 'in_progress',
                'chapter_status': {},
                'edited_questions': []
            }
            result = cls.collection.insert_one(conversation_data)
            return str(result.inserted_id)

        @classmethod
        def add_response(cls, conversation_id, user_id, response_data):
            # Verify ownership
            conv = cls.collection.find_one({
                '_id': ObjectId(conversation_id),
                'user_id': user_id
            })
            if not conv:
                raise ValueError("Conversation not found or access denied")

            # Prepare response document
            response_doc = {
                'conversation_id': ObjectId(conversation_id),
                'user_id': user_id,
                'question': clean_text(response_data['question']),
                'response': clean_text(response_data['response']),
                'evaluation': response_data['evaluation'],
                'score': response_data['score'],
                'recommendation': clean_text(response_data.get('recommendation', '')),
                'chapter': response_data['chapter'],
                'subchapter': response_data['subchapter'],
                'question_index': response_data['question_index'],
                'question_key': response_data['question_key'],
                'timestamp': datetime.utcnow()
            }

            # Insert response
            cls.responses_collection.insert_one(response_doc)

            # Update conversation status
            update_data = {
                '$set': {'last_updated': datetime.utcnow()},
                '$addToSet': {'edited_questions': response_data['question_key']}
            }

            # Update chapter status if completed
            if response_data.get('chapter_complete', False):
                update_data['$set'][f'chapter_status.{response_data["chapter"]}'] = 'completed'

            if response_data.get('assessment_complete', False):
                update_data['$set']['status'] = 'completed'

            cls.collection.update_one(
                {'_id': ObjectId(conversation_id)},
                update_data
            )

            return response_doc

        @classmethod
        def get_user_conversations(cls, user_id):
            conversations = list(cls.collection.find(
                {'user_id': user_id},
                sort=[('last_updated', DESCENDING)]
            ))
            
            # Convert ObjectId and datetime to strings
            for conv in conversations:
                conv['_id'] = str(conv['_id'])
                conv['created_at'] = conv['created_at'].isoformat()
                conv['last_updated'] = conv['last_updated'].isoformat()
            return conversations

        @classmethod
        def get_conversation_with_responses(cls, conversation_id, user_id):
            # Verify ownership
            conversation = cls.collection.find_one({
                '_id': ObjectId(conversation_id),
                'user_id': user_id
            })
            if not conversation:
                return None

            # Get responses
            responses = list(cls.responses_collection.find({
                'conversation_id': ObjectId(conversation_id)
            }).sort('timestamp', ASCENDING))

            # Convert ObjectId and datetime to strings
            conversation['_id'] = str(conversation['_id'])
            conversation['created_at'] = conversation['created_at'].isoformat()
            conversation['last_updated'] = conversation['last_updated'].isoformat()
            
            for resp in responses:
                resp['_id'] = str(resp['_id'])
                resp['conversation_id'] = str(resp['conversation_id'])
                resp['timestamp'] = resp['timestamp'].isoformat()

            return {
                'conversation': conversation,
                'responses': responses
            }

        @classmethod
        def update_response(cls, conversation_id, user_id, question_key, update_data):
            # Verify ownership
            conv = cls.collection.find_one({
                '_id': ObjectId(conversation_id),
                'user_id': user_id
            })
            if not conv:
                raise ValueError("Conversation not found or access denied")

            # Update response
            result = cls.responses_collection.update_one(
                {
                    'conversation_id': ObjectId(conversation_id),
                    'question_key': question_key
                },
                {
                    '$set': {
                        'response': clean_text(update_data['response']),
                        'evaluation': update_data['evaluation'],
                        'score': update_data['score'],
                        'recommendation': clean_text(update_data.get('recommendation', '')),
                        'timestamp': datetime.utcnow()
                    }
                }
            )

            # Update conversation's last_updated
            cls.collection.update_one(
                {'_id': ObjectId(conversation_id)},
                {
                    '$set': {'last_updated': datetime.utcnow()},
                    '$addToSet': {'edited_questions': question_key}
                }
            )

            return result.modified_count > 0

        @classmethod
        def delete_conversation(cls, conversation_id, user_id):
            # Verify ownership and delete
            result = cls.collection.delete_one({
                '_id': ObjectId(conversation_id),
                'user_id': user_id
            })
            if result.deleted_count == 0:
                return False

            # Delete associated responses
            cls.responses_collection.delete_many({
                'conversation_id': ObjectId(conversation_id)
            })
            return True

        @classmethod
        def get_chapter_responses(cls, conversation_id, user_id, chapter):
            # Verify ownership
            conv = cls.collection.find_one({
                '_id': ObjectId(conversation_id),
                'user_id': user_id
            }, {'_id': 1})
            if not conv:
                return None

            # Get chapter responses
            responses = list(cls.responses_collection.find({
                'conversation_id': ObjectId(conversation_id),
                'chapter': chapter
            }))

            for resp in responses:
                resp['_id'] = str(resp['_id'])
                resp['conversation_id'] = str(resp['conversation_id'])
                resp['timestamp'] = resp['timestamp'].isoformat()

            return responses

    # Create indexes
    db.conversations.create_indexes([
        IndexModel([('user_id', ASCENDING)]),
        IndexModel([('last_updated', DESCENDING)]),
        IndexModel([('norme', ASCENDING)]),
        IndexModel([('status', ASCENDING)])
    ])
    
    db.responses.create_indexes([
        IndexModel([('conversation_id', ASCENDING)]),
        IndexModel([('question_key', ASCENDING)]),
        IndexModel([('chapter', ASCENDING), ('subchapter', ASCENDING)])
    ])
    
    return Conversation