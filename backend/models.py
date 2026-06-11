from pydantic import BaseModel
from typing import List, Optional

class RankingItem(BaseModel):
    name: str
    count: int
    
class CoreStats(BaseModel):
    total_hours: float
    total_days: float
    top_artists: List[RankingItem]
    top_tracks: List[RankingItem]
    offline_survival_tracks: List[RankingItem]
    
# More models will be added as we implement features
