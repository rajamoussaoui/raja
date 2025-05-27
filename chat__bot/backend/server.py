from flask import Flask, jsonify, request
import json
import google.generativeai as genai
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from io import BytesIO
from flask_cors import CORS
import re
from collections import defaultdict
# Importation des modules MongoDB
from pymongo import MongoClient
from bson import ObjectId
import datetime

# Configuration MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['iso_assessment_db']
conversations_collection = db['conversations']
responses_collection = db['responses']

# Configuration
genai.configure(api_key="AIzaSyAX1C9gblij_nYIGqSWIvwIwoRTH0XxcZU")

model = genai.GenerativeModel('gemini-2.0-flash')

app = Flask(__name__)
CORS(app)

# Scoring dictionary            
scores = {
    "compliant": 100,
    "acceptable": 75,
    "needs improvement": 45,
    "non-compliant": 0,
    "not applicable": None
}

user_sessions = {}

def clean_text(text):
    """Clean and normalize text for consistent formatting"""
    if not text:
        return ""
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.replace("Ã©", "é").replace("Ã¨", "è")
    text = text.replace("Ãª", "ê").replace("Ãç", "ç")
    return text

def analyze_iso_response(norme, question, reponse, description):
    """Analyze response and generate evaluation with recommendation"""
    eval_prompt = f"""
    As an ISO {norme.upper()} auditor, evaluate this response:
    
    Standard Description: {description}
    
    Question: {question}
    Response: {reponse}
    
    Classify the compliance level using ONLY these exact terms:
    - "compliant" (fully meets requirements)
    - "acceptable" (partially meets requirements)
    - "needs improvement" (minimal implementation)
    - "non-compliant" (does not meet requirements)
    - "not applicable" (when the user enter n/a or not applicable)
    
    Return ONLY the classification term:
    """
    
    try:
        # Get evaluation
        eval_response = model.generate_content(eval_prompt)
        evaluation = clean_text(eval_response.text).strip().lower()
        
        # Validate evaluation against allowed terms
        valid_evaluations = list(scores.keys())
        
        if evaluation not in valid_evaluations and evaluation != "not applicable":
            evaluation = "non-compliant"
        
        # Score is None for "not applicable", otherwise from scores dict
        score = scores.get(evaluation)
        
        # Generate recommendation only for non-compliant cases (not for "not applicable")
        recommendation = ""
        if evaluation in scores and evaluation != "compliant" and evaluation != "not applicable":
            rec_prompt = f"""
            As an ISO {norme.upper()} auditor, provide one specific recommendation to improve this:
            
            Question: {question}
            Response: {reponse}
            Current Evaluation: {evaluation}
            
            Provide a concise, actionable recommendation (1-2 sentences):
            """
            rec_response = model.generate_content(rec_prompt)
            recommendation = clean_text(rec_response.text).strip()
        
        return evaluation, score, recommendation
        
    except Exception as e:
        print(f"Error analyzing response: {str(e)}")
        return "non-compliant", 0, ""

def generate_radar_chart(values, categories, title="Compliance Evaluation"):
    """Generate radar chart visualization"""
    try:
        num_vars = len(categories)
        values += values[:1]
        angles = [n / float(num_vars) * 2 * 3.1416 for n in range(num_vars)]
        angles += angles[:1]

        fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
        ax.set_theta_offset(3.1416 / 2)
        ax.set_theta_direction(-1)
        ax.set_rlabel_position(0)
        ax.set_ylim(0, 100)
        plt.xticks(angles[:-1], categories, fontsize=10, wrap=True)
        plt.title(title, size=14, y=1.1)

        ax.plot(angles, values, linewidth=2, linestyle='solid')
        ax.fill(angles, values, 'b', alpha=0.1)

        buf = BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', dpi=120)
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode('utf-8')
    except Exception as e:
        print(f"Error generating chart: {str(e)}")
        return None

@app.route("/api/questions/<norme>", methods=["GET"])
def get_questions(norme):
    """Initialize assessment with questions"""
    try:
        with open(f"{norme.lower()}.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            
            chapters = list(data["questions"].keys())
            first_chapter = chapters[0]
            first_subchapter = list(data["questions"][first_chapter].keys())[0]
            
            # Créer une nouvelle conversation dans MongoDB
            conversation_id = str(ObjectId())
            conversation_data = {
                "_id": ObjectId(conversation_id),
                "norme": norme,
                "description": clean_text(data["description"]),
                "created_at": datetime.datetime.now(),
                "status": "in_progress",
                "last_updated": datetime.datetime.now()
            }
            conversations_collection.insert_one(conversation_data)
            
            # Always create a new session when starting
            user_sessions[norme] = {
                "description": data["description"],
                "responses": [],
                "responses_by_question": {},
                "current_chapter": first_chapter,
                "current_subchapter": first_subchapter,
                "current_question_index": 0,
                "chapters": chapters,
                "subchapters": {
                    chapter: list(subchapters.keys())
                    for chapter, subchapters in data["questions"].items()
                },
                "chapter_status": {},
                "edited_questions": {},  # Track edited questions for this session
                "conversation_id": conversation_id  # Stocker l'ID de conversation
            }
            
            session = user_sessions[norme]
            
            questions = [
                {
                    "chapter": chapter,
                    "subchapter": subchapter,
                    "question": question,
                    "question_number": idx + 1,
                    "total_questions": len(data["questions"][chapter][subchapter])
                }
                for chapter in data["questions"]
                for subchapter in data["questions"][chapter]
                for idx, question in enumerate(data["questions"][chapter][subchapter])
            ]
            
            return jsonify({
                "description": clean_text(data["description"]),
                "questions": questions,
                "conversation_id": conversation_id,  # Renvoyer l'ID de conversation
                "chapters": [
                    {
                        "name": chapter,
                        "subchapters": [
                            {
                                "name": subchapter,
                                "question_count": len(data["questions"][chapter][subchapter])
                            }
                            for subchapter in data["questions"][chapter]
                        ]
                    }
                    for chapter in data["questions"]
                ]
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/repondre", methods=["POST"])
def handle_response():
    """Process user response and provide evaluation"""
    data = request.json
    norme = data.get("norme", "").lower()
    reponse = clean_text(data.get("reponse", ""))

    if norme not in user_sessions:
        return jsonify({"error": "Session not found"}), 404

    session = user_sessions[norme]
    
    with open(f"{norme.lower()}.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        current_questions = data["questions"][session["current_chapter"]][session["current_subchapter"]]
        current_question = current_questions[session["current_question_index"]]

    evaluation, score, recommendation = analyze_iso_response(
        norme, current_question, reponse, session["description"]
    )
    
    # Create response data
    question_key = f"{session['current_chapter']}_{session['current_subchapter']}_{session['current_question_index']}"
    response_data = {
        "question": clean_text(current_question),
        "reponse": reponse,
        "evaluation": evaluation,
        "score": score,
        "recommendation": recommendation,
        "chapter": session["current_chapter"],
        "subchapter": session["current_subchapter"],
        "question_index": session["current_question_index"],
        "question_key": question_key
    }
    
    # Check if this question was already answered
    existing_response_index = None
    for idx, resp in enumerate(session["responses"]):
        if (resp["chapter"] == session["current_chapter"] and 
            resp["subchapter"] == session["current_subchapter"] and 
            resp["question_index"] == session["current_question_index"]):
            existing_response_index = idx
            break
    
    if existing_response_index is not None:
        # Update existing response
        session["responses"][existing_response_index] = response_data
    else:
        # Add new response
        session["responses"].append(response_data)
    
    # Update responses_by_question for quick lookup
    session["responses_by_question"][question_key] = response_data

    # Enregistrer la réponse dans MongoDB
    mongodb_response = {
        "conversation_id": ObjectId(session["conversation_id"]),
        "question": clean_text(current_question),
        "response": reponse,
        "evaluation": evaluation,
        "score": score,
        "recommendation": recommendation,
        "chapter": session["current_chapter"],
        "subchapter": session["current_subchapter"],
        "question_index": session["current_question_index"],
        "question_key": question_key,
        "timestamp": datetime.datetime.now()
    }
    responses_collection.insert_one(mongodb_response)
    
    # Mettre à jour le statut de la conversation
    conversations_collection.update_one(
        {"_id": ObjectId(session["conversation_id"])},
        {"$set": {"last_updated": datetime.datetime.now()}}
    )

    # Determine next question and completion status
    next_data = {
        "chapter_complete": False,
        "assessment_complete": False
    }

    if session["current_question_index"] + 1 < len(current_questions):
        # More questions in current subchapter
        next_data.update({
            "next_question": clean_text(current_questions[session["current_question_index"] + 1]),
            "next_question_index": session["current_question_index"] + 1
        })
    else:
        current_subchapter_idx = session["subchapters"][session["current_chapter"]].index(session["current_subchapter"])
        
        if current_subchapter_idx + 1 < len(session["subchapters"][session["current_chapter"]]):
            # Move to next subchapter in current chapter
            next_subchapter = session["subchapters"][session["current_chapter"]][current_subchapter_idx + 1]
            next_data.update({
                "next_question": clean_text(data["questions"][session["current_chapter"]][next_subchapter][0]),
                "next_subchapter": next_subchapter,
                "next_question_index": 0
            })
        else:
            current_chapter_idx = session["chapters"].index(session["current_chapter"])
            
            if current_chapter_idx + 1 < len(session["chapters"]):
                # Move to next chapter
                next_chapter = session["chapters"][current_chapter_idx + 1]
                next_subchapter = session["subchapters"][next_chapter][0]
                next_data.update({
                    "next_question": clean_text(data["questions"][next_chapter][next_subchapter][0]),
                    "next_chapter": next_chapter,
                    "next_subchapter": next_subchapter,
                    "next_question_index": 0,
                    "chapter_complete": True
                })
                # Mark current chapter as completed
                session["chapter_status"][session["current_chapter"]] = "completed"
            else:
                # Assessment is complete
                next_data.update({
                    "chapter_complete": True,
                    "assessment_complete": True
                })
                # Mark final chapter as completed
                session["chapter_status"][session["current_chapter"]] = "completed"
                
                # Marquer la conversation comme complète
                conversations_collection.update_one(
                    {"_id": ObjectId(session["conversation_id"])},
                    {"$set": {"status": "completed", "last_updated": datetime.datetime.now()}}
                )

    # Update session with next question data
    if "next_question_index" in next_data:
        session["current_question_index"] = next_data["next_question_index"]
    if "next_subchapter" in next_data:
        session["current_subchapter"] = next_data["next_subchapter"]
    if "next_chapter" in next_data:
        session["current_chapter"] = next_data["next_chapter"]

    # Merge all data for the final response
    final_response = {
        **response_data,
        **next_data
    }
    
    return jsonify(final_response)

@app.route("/api/modifier_reponse", methods=["POST"])
def modify_response():
    """Modify an existing response"""
    data = request.json
    norme = data.get("norme", "").lower()
    question_key = data.get("question_key", "")
    new_response = clean_text(data.get("new_response", ""))

    if norme not in user_sessions:
        return jsonify({"error": "Session not found"}), 404

    session = user_sessions[norme]
    
    # Check if the question exists in responses_by_question
    if question_key not in session["responses_by_question"]:
        return jsonify({"error": "Response not found"}), 404

    # Get the original response data
    original_response = session["responses_by_question"][question_key]
    
    # Load the original question
    with open(f"{norme.lower()}.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        try:
            original_question = data["questions"][original_response["chapter"]][original_response["subchapter"]][original_response["question_index"]]
        except (KeyError, IndexError):
            return jsonify({"error": "Original question not found"}), 404

    # Re-evaluate the new response
    evaluation, score, recommendation = analyze_iso_response(
        norme, original_question, new_response, session["description"]
    )

    # Create updated response
    updated_response = {
        "question": clean_text(original_question),
        "reponse": new_response,
        "evaluation": evaluation,
        "score": score,
        "recommendation": recommendation,
        "chapter": original_response["chapter"],
        "subchapter": original_response["subchapter"],
        "question_index": original_response["question_index"],
        "question_key": question_key
    }

    # Update both responses storage
    session["responses_by_question"][question_key] = updated_response
    
    # Find and update in the responses list
    for idx, response in enumerate(session["responses"]):
        if response["question_key"] == question_key:
            session["responses"][idx] = updated_response
            break

    # Mettre à jour la réponse dans MongoDB
    responses_collection.update_one(
        {
            "conversation_id": ObjectId(session["conversation_id"]),
            "question_key": question_key
        },
        {
            "$set": {
                "response": new_response,
                "evaluation": evaluation,
                "score": score,
                "recommendation": recommendation,
                "timestamp": datetime.datetime.now()
            }
        }
    )
    
    # Mettre à jour la date de dernière modification de la conversation
    conversations_collection.update_one(
        {"_id": ObjectId(session["conversation_id"])},
        {"$set": {"last_updated": datetime.datetime.now()}}
    )

    # Track that this question has been edited
    session["edited_questions"][question_key] = True

    return jsonify({
        "success": True,
        "updated_response": updated_response,
        "message": "Response updated successfully"
    })

@app.route("/api/get_responses/<norme>", methods=["GET"])
def get_responses(norme):
    """Get all responses for a given norm"""
    norme = norme.lower()
    
    if norme not in user_sessions:
        return jsonify({"error": "Session not found"}), 404

    session = user_sessions[norme]
    
    if "responses" not in session:
        return jsonify({"error": "No responses available"}), 404

    return jsonify({
        "responses": session["responses"],
        "total_responses": len(session["responses"]),
        "edited_questions": list(session.get("edited_questions", {}).keys())
    })

# Nouvelle route pour récupérer l'historique des conversations
@app.route("/api/conversations/history", methods=["GET"])
def get_conversation_history():
    """Get conversation history from MongoDB"""
    try:
        conversations = list(conversations_collection.find().sort("last_updated", -1))
        
        # Convert MongoDB objects to JSON-serializable format
        serialized_conversations = []
        for conv in conversations:
            serialized = {
                "_id": str(conv["_id"]),  # Convert ObjectId to string
                "norme": conv["norme"],
                "description": conv["description"],
                "created_at": conv["created_at"].isoformat(),  # Convert datetime to string
                "last_updated": conv["last_updated"].isoformat(),
                "status": conv["status"],
            }
            if "final_score" in conv:
                serialized["final_score"] = conv["final_score"]
            serialized_conversations.append(serialized)
        
        return jsonify({
            "success": True,
            "conversations": serialized_conversations
        })
    except Exception as e:
        return jsonify({
            "error": f"Could not retrieve conversation history: {str(e)}"
        }), 500

# Nouvelle route pour charger une conversation spécifique
@app.route("/api/conversations/<conversation_id>", methods=["GET"])
def load_conversation(conversation_id):
    """Load a specific conversation by ID"""
    try:
        # Récupérer la conversation
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Récupérer toutes les réponses associées à cette conversation
        responses = list(responses_collection.find({"conversation_id": ObjectId(conversation_id)}))
        
        # Convertir les objets pour la sérialisation JSON
        conversation["_id"] = str(conversation["_id"])
        conversation["created_at"] = conversation["created_at"].isoformat()
        conversation["last_updated"] = conversation["last_updated"].isoformat()
        
        for resp in responses:
            resp["_id"] = str(resp["_id"])
            resp["conversation_id"] = str(resp["conversation_id"])
            resp["timestamp"] = resp["timestamp"].isoformat()
        
        # Récupérer les informations du standard
        norme = conversation["norme"].lower()
        with open(f"{norme.lower()}.json", "r", encoding="utf-8") as f:
            standard_data = json.load(f)
        
        # Recréer la session en mémoire si nécessaire
        if norme not in user_sessions:
            chapters = list(standard_data["questions"].keys())
            first_chapter = chapters[0]
            first_subchapter = list(standard_data["questions"][first_chapter].keys())[0]
            
            # Créer la session avec les données existantes
            user_sessions[norme] = {
                "description": conversation["description"],
                "responses": [],
                "responses_by_question": {},
                "current_chapter": first_chapter,
                "current_subchapter": first_subchapter,
                "current_question_index": 0,
                "chapters": chapters,
                "subchapters": {
                    chapter: list(subchapters.keys())
                    for chapter, subchapters in standard_data["questions"].items()
                },
                "chapter_status": {},
                "edited_questions": {},
                "conversation_id": conversation_id
            }
        
        # Charger les réponses dans la session en mémoire
        session = user_sessions[norme]
        session["responses"] = []
        session["responses_by_question"] = {}
        
        for resp in responses:
            response_data = {
                "question": resp["question"],
                "reponse": resp["response"],
                "evaluation": resp["evaluation"],
                "score": resp["score"],
                "recommendation": resp.get("recommendation", ""),
                "chapter": resp["chapter"],
                "subchapter": resp["subchapter"],
                "question_index": resp["question_index"],
                "question_key": resp["question_key"]
            }
            
            session["responses"].append(response_data)
            session["responses_by_question"][resp["question_key"]] = response_data
        
        return jsonify({
            "success": True,
            "conversation": conversation,
            "responses": responses,
            "standard_info": {
                "description": clean_text(standard_data["description"]),
                "chapters": [
                    {
                        "name": chapter,
                        "subchapters": [
                            {
                                "name": subchapter,
                                "question_count": len(standard_data["questions"][chapter][subchapter])
                            }
                            for subchapter in standard_data["questions"][chapter]
                        ]
                    }
                    for chapter in standard_data["questions"]
                ]
            }
        })
        
    except Exception as e:
        return jsonify({"error": f"Could not load conversation: {str(e)}"}), 500

@app.route("/api/chapter_resume", methods=["POST"])
def chapter_summary():
    """Generate chapter summary with scores"""
    try:
        data = request.json
        norme = data.get("norme", "").lower()
        chapter = data.get("chapter", "")
        conversation_id = data.get("conversation_id")

        if not norme or not chapter:
            return jsonify({"error": "Norme and chapter parameters are required"}), 400

        if norme not in user_sessions:
            return jsonify({"error": "Session not found"}), 404

        session = user_sessions[norme]
        
        # Si un conversation_id est fourni, vérifier qu'il correspond
        if conversation_id and session.get("conversation_id") != conversation_id:
            return jsonify({"error": "Conversation ID mismatch"}), 400
        
        if "responses" not in session or not session["responses"]:
            return jsonify({"error": "No responses available"}), 400

        chapter_responses = [r for r in session["responses"] if r.get("chapter") == chapter]
        
        if not chapter_responses:
            return jsonify({"error": "No data available for this chapter"}), 400

        # Calculate chapter score (filter out None scores)
        valid_scores = [r["score"] for r in chapter_responses if r.get("score") is not None]
        if not valid_scores:
            return jsonify({"error": "No valid scores available for this chapter"}), 400
            
        chapter_score = round(sum(valid_scores) / len(valid_scores), 2)

        # Group by subchapters
        subchapter_data = defaultdict(list)
        for r in chapter_responses:
            if "subchapter" in r and r.get("score") is not None:
                subchapter_data[r["subchapter"]].append(r["score"])

        subchapter_scores = {
            sc: round(sum(scores) / len(scores), 2)
            for sc, scores in subchapter_data.items()
        }

        if not subchapter_scores:
            return jsonify({"error": "No subchapter data available"}), 400

        graphique = generate_radar_chart(
            list(subchapter_scores.values()),
            list(subchapter_scores.keys()),
            f"Compliance for {chapter}"
        )

        return jsonify({
            "score_chapitre": chapter_score,
            "scores_sous_chapitres": subchapter_scores,
            "graphique": graphique if graphique else None,
            "chapter": chapter
        })

    except Exception as e:
        print(f"Error generating chapter summary: {str(e)}")
        return jsonify({"error": "Could not generate chapter summary"}), 500

@app.route("/api/resume", methods=["POST"])
def generate_summary():
    """Generate final assessment summary with grouped recommendations"""
    try:
        data = request.json
        norme = data.get("norme", "").lower()
        only_completed = data.get("only_completed", False)
        conversation_id = data.get("conversation_id")

        if not norme:
            return jsonify({"error": "Norme parameter is required"}), 400

        if norme not in user_sessions:
            return jsonify({"error": "Session not found"}), 404

        session = user_sessions[norme]
        
        # Si un conversation_id est fourni, vérifier qu'il correspond
        if conversation_id and session.get("conversation_id") != conversation_id:
            return jsonify({"error": "Conversation ID mismatch"}), 400
        
        if "responses" not in session or not session["responses"]:
            return jsonify({"error": "No responses available"}), 400

        responses = session["responses"]
        if only_completed:
            chapter_status = session.get("chapter_status", {})
            completed_chapters = [chap for chap, status in chapter_status.items() 
                               if status == "completed"]
            responses = [r for r in responses if r.get("chapter") in completed_chapters]
            
            if not responses:
                return jsonify({
                    "error": "No completed chapters available",
                    "available_chapters": list(chapter_status.keys())
                }), 400

        valid_scores = [r.get("score") for r in responses if r.get("score") is not None]
        if not valid_scores:
            return jsonify({"error": "No valid scores available"}), 400
            
        score_final = round(sum(valid_scores) / len(valid_scores), 2)

        chapters = {r["chapter"] for r in responses if "chapter" in r}
        if not chapters:
            return jsonify({"error": "No chapter data available"}), 400

        chapter_scores = {}
        grouped_data = {}
        subchapter_scores = {}
        graphiques_sous_chapitres = {}

        for chapter in chapters:
            chapter_responses = [r for r in responses if r.get("chapter") == chapter]
            
            chapter_valid_scores = [r.get("score") for r in chapter_responses 
                                 if r.get("score") is not None]
            if chapter_valid_scores:
                chapter_scores[chapter] = round(
                    sum(chapter_valid_scores) / len(chapter_valid_scores), 
                    2
                )

            subchapters = {r["subchapter"] for r in chapter_responses 
                         if "subchapter" in r}
            grouped_data[chapter] = {}
            
            for subchapter in subchapters:
                sub_responses = [r for r in chapter_responses 
                              if r.get("subchapter") == subchapter]
                sub_valid_scores = [r.get("score") for r in sub_responses 
                                 if r.get("score") is not None]
                
                if sub_valid_scores:
                    sub_score = round(sum(sub_valid_scores) / len(sub_valid_scores), 2)
                    subchapter_scores[f"{chapter} - {subchapter}"] = sub_score
                    
                    recommendations = [
                        r.get("recommendation", "") for r in sub_responses 
                        if r.get("recommendation", "").strip()
                    ]
                    
                    grouped_data[chapter][subchapter] = {
                        "score": sub_score,
                        "responses": sub_responses,
                        "recommendations": recommendations
                    }

            if grouped_data[chapter]:
                chart = generate_radar_chart(
                    [data["score"] for data in grouped_data[chapter].values()],
                    list(grouped_data[chapter].keys()),
                    f"Compliance for {chapter}"
                )
                if chart:
                    graphiques_sous_chapitres[chapter] = chart

        graphique_principal = None
        if chapter_scores:
            graphique_principal = generate_radar_chart(
                list(chapter_scores.values()),
                list(chapter_scores.keys()),
                "Overall Compliance by Chapter"
            )

        resume_detaille = []
        for r in responses:
            if "question" in r and "chapter" in r and "subchapter" in r:
                resume_detaille.append({
                    "question": clean_text(r["question"]),
                    "reponse": clean_text(r.get("reponse", "")),
                    "evaluation": r.get("evaluation", ""),
                    "score": r.get("score"),
                    "recommendation": r.get("recommendation", ""),
                    "chapter": r["chapter"],
                    "subchapter": r["subchapter"],
                    "is_compliant": r.get("evaluation", "") == "compliant",
                    "question_key": r.get("question_key", "")
                })

        structured_recommendations = []
        for chapter, subchapters in grouped_data.items():
            chapter_recs = []
            for subchapter, data in subchapters.items():
                if data["recommendations"]:
                    subchapter_header = f"• {chapter} - {subchapter} (Score: {data['score']}%)"
                    subchapter_recs = "\n".join(f"- {rec}" for rec in data["recommendations"])
                    chapter_recs.append(f"{subchapter_header}\n{subchapter_recs}")
            
            if chapter_recs:
                structured_recommendations.append("\n".join(chapter_recs))

        recommendations_text = "• Key Recommendations by Chapter\n\n" + \
                            "\n\n".join(structured_recommendations) if structured_recommendations \
                            else "No specific recommendations"

        # Si l'évaluation est complète, sauvegarder le résumé dans MongoDB
        if not only_completed and session.get("conversation_id"):
            summary_data = {
                "conversation_id": ObjectId(session["conversation_id"]),
                "score_final": score_final,
                "scores_chapitres": chapter_scores,
                "scores_sous_chapitres": subchapter_scores,
                "recommendations": recommendations_text,
                "timestamp": datetime.datetime.now()
            }
            
            # Mettre à jour ou insérer le résumé dans la collection conversations
            conversations_collection.update_one(
                {"_id": ObjectId(session["conversation_id"])},
                {
                    "$set": {
                        "summary": summary_data,
                        "status": "completed" if not only_completed else "in_progress",
                        "final_score": score_final,
                        "last_updated": datetime.datetime.now()
                    }
                }
            )

        return jsonify({
            "score_final": score_final,
            "graphique_principal": graphique_principal,
            "graphiques_sous_chapitres": graphiques_sous_chapitres,
            "scores_chapitres": chapter_scores,
            "scores_sous_chapitres": subchapter_scores,
            "resume_detaille": resume_detaille,
            "recommendations": recommendations_text,
            "grouped_data": grouped_data,
            "total_questions": len(responses),
            "chapters_completed": len(chapters),
            "is_partial": only_completed,
            "edited_questions": list(session.get("edited_questions", {}).keys()),
            "conversation_id": session.get("conversation_id")  # Inclure l'ID de conversation
        })

    except Exception as e:
        print(f"Error generating summary: {str(e)}", flush=True)
        return jsonify({
            "error": "Could not generate final report",
            "details": str(e)
        }), 500

# Route pour supprimer une conversation
@app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """Delete a conversation and all its responses"""
    try:
        # Vérifier si la conversation existe
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Supprimer toutes les réponses associées
        responses_collection.delete_many({"conversation_id": ObjectId(conversation_id)})
        
        # Supprimer la conversation
        conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
        
        # Si la conversation est chargée en mémoire, la retirer
        norme = conversation.get("norme", "").lower()
        if norme in user_sessions and user_sessions[norme].get("conversation_id") == conversation_id:
            del user_sessions[norme]
        
        return jsonify({
            "success": True,
            "message": "Conversation deleted successfully"
        })
        
    except Exception as e:
        return jsonify({"error": f"Could not delete conversation: {str(e)}"}), 500

# Route pour exporter les données d'une conversation au format JSON
@app.route("/api/conversations/<conversation_id>/export", methods=["GET"])
def export_conversation(conversation_id):
    """Export conversation data as JSON"""
    try:
        # Récupérer la conversation
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Récupérer toutes les réponses associées
        responses = list(responses_collection.find({"conversation_id": ObjectId(conversation_id)}))
        
        # Formater les données pour l'export
        export_data = {
            "conversation_id": str(conversation["_id"]),
            "norme": conversation["norme"],
            "description": conversation["description"],
            "created_at": conversation["created_at"].isoformat(),
            "last_updated": conversation["last_updated"].isoformat(),
            "status": conversation["status"],
            "responses": []
        }
        
        # Ajouter le résumé s'il existe
        if "summary" in conversation:
            summary = conversation["summary"]
            export_data["summary"] = {
                "score_final": summary["score_final"],
                "scores_chapitres": summary["scores_chapitres"],
                "scores_sous_chapitres": summary["scores_sous_chapitres"],
                "recommendations": summary["recommendations"]
            }
        
        # Formater les réponses
        for resp in responses:
            export_data["responses"].append({
                "question": resp["question"],
                "response": resp["response"],
                "evaluation": resp["evaluation"],
                "score": resp["score"],
                "recommendation": resp.get("recommendation", ""),
                "chapter": resp["chapter"],
                "subchapter": resp["subchapter"],
                "question_key": resp["question_key"],
                "timestamp": resp["timestamp"].isoformat()
            })
        
        return jsonify(export_data)
        
    except Exception as e:
        return jsonify({"error": f"Could not export conversation: {str(e)}"}), 500

# Route pour rechercher des conversations
@app.route("/api/conversations/search", methods=["GET"])
def search_conversations():
    """Search conversations based on query parameters"""
    try:
        norme = request.args.get("norme")
        status = request.args.get("status")
        date_from = request.args.get("date_from")
        date_to = request.args.get("date_to")
        min_score = request.args.get("min_score")
        
        # Construire la requête de recherche
        query = {}
        
        if norme:
            query["norme"] = norme.lower()
        
        if status:
            query["status"] = status
        
        date_query = {}
        if date_from:
            date_query["$gte"] = datetime.datetime.fromisoformat(date_from)
        if date_to:
            date_query["$lte"] = datetime.datetime.fromisoformat(date_to)
        
        if date_query:
            query["created_at"] = date_query
        
        if min_score:
            query["final_score"] = {"$gte": float(min_score)}
        
        # Exécuter la recherche
        conversations = list(conversations_collection.find(query).sort("last_updated", -1))
        
        # Formater les résultats
        results = []
        for conv in conversations:
            results.append({
                "_id": str(conv["_id"]),
                "norme": conv["norme"],
                "created_at": conv["created_at"].isoformat(),
                "last_updated": conv["last_updated"].isoformat(),
                "status": conv["status"],
                "final_score": conv.get("final_score")
            })
        
        return jsonify({
            "success": True,
            "results": results,
            "count": len(results)
        })
        
    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)