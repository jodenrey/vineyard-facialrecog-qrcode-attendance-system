import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import urllib.parse as up

# Load environment variables from .env file
load_dotenv()

# Parse the DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    """Establish and return a connection to the PostgreSQL database."""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn
