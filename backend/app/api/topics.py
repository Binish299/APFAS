import random
from typing import List
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/topics", tags=["Speaking Topics"])

class TopicResponse(BaseModel):
    id: int
    topic: str
    prompt: str
    suggested_keywords: List[str]

TOPICS_DB = [
    {
        "id": 1,
        "topic": "Technology",
        "prompt": "Discuss how modern technology has changed communication in everyday life. Speak for 1-2 minutes.",
        "suggested_keywords": ["connectivity", "smartphone", "digital age", "efficiency", "productivity"]
    },
    {
        "id": 2,
        "topic": "Education in Nepal",
        "prompt": "Explain the key improvements needed in the rural schools of Nepal. Speak for 2 minutes.",
        "suggested_keywords": ["infrastructure", "literacy", "digital literacy", "funding", "equality"]
    },
    {
        "id": 3,
        "topic": "Tourism in Nepal",
        "prompt": "Highlight why Nepal is a prime location for eco-tourism and cultural expeditions. Speak for 2-3 minutes.",
        "suggested_keywords": ["mountaineering", "hospitality", "heritage", "sustainable", "adventure"]
    },
    {
        "id": 4,
        "topic": "Social Media",
        "prompt": "Do the benefits of social media outweigh its drawbacks on mental health? Outline your perspective.",
        "suggested_keywords": ["comparison", "interaction", "cyberbullying", "awareness", "community"]
    },
    {
        "id": 5,
        "topic": "Artificial Intelligence",
        "prompt": "Describe how local businesses can integrate AI to improve service delivery in Nepal.",
        "suggested_keywords": ["automation", "efficiency", "customer support", "innovation", "data analytics"]
    },
    {
        "id": 6,
        "topic": "Climate Change",
        "prompt": "Describe the visible impact of global warming on the Himalayan glaciers of Nepal.",
        "suggested_keywords": ["melting ice", "unpredictable weather", "glaciers", "agricultural impact", "ecology"]
    },
    {
        "id": 7,
        "topic": "Favorite Book",
        "prompt": "Share a book that drastically changed your worldview and explain why.",
        "suggested_keywords": ["perspective", "narrative", "enlightening", "inspiration", "philosophy"]
    },
    {
        "id": 8,
        "topic": "My Career Goal",
        "prompt": "Elaborate on where you see yourself professionally in five years and the steps to achieve it.",
        "suggested_keywords": ["aspiration", "expertise", "leadership", "dedication", "growth"]
    }
]

@router.get("/random", response_model=TopicResponse)
def get_random_topic():
    """Select and return a random impromptu speaking topic challenge."""
    return random.choice(TOPICS_DB)

@router.get("/list", response_model=List[TopicResponse])
def get_all_topics():
    """Return all available speech prompt topics."""
    return TOPICS_DB
