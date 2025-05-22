import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

class Database:
    """Database connection class for face recognition"""

    def __init__(self):
        self.conn = None
        self.cursor = None

    def connect(self):
        """Connect to the PostgreSQL database using DATABASE_URL"""
        try:
            self.conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            self.cursor = self.conn.cursor()
            return True
        except Exception as e:
            print(f"Connection error: {e}")
            return False

    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()

    def save_embedding(self, user_id: str, embedding: List[float]) -> bool:
        """Save or update a face embedding for a user"""
        if self.connect():
            try:
                # Check if embedding already exists
                self.cursor.execute(
                    """
                    SELECT "userId" FROM "FaceEmbedding" WHERE "userId" = %s
                    """,
                    (user_id,)
                )
                existing = self.cursor.fetchone()

                embedding_json = json.dumps(embedding)

                if existing:
                    # Update existing embedding
                    self.cursor.execute(
                        """
                        UPDATE "FaceEmbedding"
                        SET embedding = %s, "updatedAt" = CURRENT_TIMESTAMP 
                        WHERE "userId" = %s
                        """,
                        (embedding_json, user_id)
                    )
                else:
                    # Create new embedding
                    self.cursor.execute(
                        """
                        INSERT INTO "FaceEmbedding" (id, "userId", embedding, "createdAt", "updatedAt")
                        VALUES (gen_random_uuid(), %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """,
                        (user_id, embedding_json)
                    )
                self.conn.commit()
                return True
            except Exception as e:
                print(f"Error saving embedding: {e}")
                self.conn.rollback()
                return False
            finally:
                self.close()
        return False

    def get_all_embeddings(self) -> List[Dict[str, Any]]:
        """Get all face embeddings"""
        if self.connect():
            try:
                self.cursor.execute("""
                    SELECT "userId", embedding 
                    FROM "FaceEmbedding"
                """)
                rows = self.cursor.fetchall()
                return [
                    {"user_id": row["userId"], "embedding": json.loads(row["embedding"])}
                    for row in rows
                ]
            except Exception as e:
                print(f"Error getting embeddings: {e}")
                return []
            finally:
                self.close()
        return []

    def get_embedding_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific user's face embedding"""
        if self.connect():
            try:
                self.cursor.execute(
                    """
                    SELECT embedding 
                    FROM "FaceEmbedding" 
                    WHERE "userId" = %s
                    """,
                    (user_id,)
                )
                result = self.cursor.fetchone()
                if result:
                    return {"user_id": user_id, "embedding": json.loads(result["embedding"])}
                return None
            except Exception as e:
                print(f"Error retrieving embedding: {e}")
                return None
            finally:
                self.close()
        return None

    def delete_embedding(self, user_id: str) -> bool:
        """Delete a user's face embedding"""
        if self.connect():
            try:
                self.cursor.execute(
                    """
                    DELETE FROM "FaceEmbedding" 
                    WHERE "userId" = %s
                    """,
                    (user_id,)
                )
                self.conn.commit()
                return self.cursor.rowcount > 0
            except Exception as e:
                print(f"Error deleting embedding: {e}")
                self.conn.rollback()
                return False
            finally:
                self.close()
        return False
