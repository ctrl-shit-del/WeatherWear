"""
Wardrobe module - manages user wardrobe items in JSON storage.
"""

import json
import os
from datetime import datetime

WARDROBE_FILE = os.path.join(os.path.dirname(__file__), "../data/wardrobe_demo.json")


def _load_all() -> dict:
    try:
        with open(WARDROBE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_all(data: dict) -> None:
    with open(WARDROBE_FILE, "w") as f:
        json.dump(data, f, indent=2)


def load_wardrobe(user_id: str) -> list:
    """Load wardrobe items for a user."""
    all_data = _load_all()
    return all_data.get(user_id, {}).get("items", [])


def save_wardrobe(user_id: str, items: list) -> None:
    """Save all wardrobe items for a user."""
    all_data = _load_all()
    if user_id not in all_data:
        all_data[user_id] = {}
    all_data[user_id]["items"] = items
    _save_all(all_data)


def add_item(user_id: str, item: dict) -> dict:
    """Add a new item to the user's wardrobe."""
    items = load_wardrobe(user_id)

    # Generate a unique ID
    existing_ids = [i.get("id", "") for i in items]
    new_id = f"W{len(items) + 1:03d}"
    while new_id in existing_ids:
        new_id = f"W{int(new_id[1:]) + 1:03d}"

    new_item = {
        "id": new_id,
        "name": item.get("name", "Unnamed Item"),
        "type": item.get("type", "other"),
        "category": item.get("category", "other"),
        "fabric": item.get("fabric", "unknown"),
        "color": item.get("color", "unknown"),
        "tags": item.get("tags", []),
        "weather_suitability": item.get("weather_suitability", ["cool", "warm"]),
        "rain_suitable": item.get("rain_suitable", False),
        "times_worn": 0,
        "last_worn": None,
        "added_date": datetime.now().strftime("%Y-%m-%d"),
        "image_placeholder": item.get("type", "other"),
        "notes": item.get("notes", "")
    }

    items.append(new_item)
    save_wardrobe(user_id, items)
    return new_item


def remove_item(user_id: str, item_id: str) -> bool:
    """Remove an item from the user's wardrobe. Returns True if found and removed."""
    items = load_wardrobe(user_id)
    original_len = len(items)
    items = [i for i in items if i.get("id") != item_id]
    if len(items) < original_len:
        save_wardrobe(user_id, items)
        return True
    return False


def update_item(user_id: str, item_id: str, updates: dict) -> dict | None:
    """Update an existing wardrobe item."""
    items = load_wardrobe(user_id)
    for i, item in enumerate(items):
        if item.get("id") == item_id:
            items[i].update(updates)
            save_wardrobe(user_id, items)
            return items[i]
    return None


def increment_wear(user_id: str, item_ids: list) -> None:
    """Increment the wear count for outfit items."""
    items = load_wardrobe(user_id)
    today = datetime.now().strftime("%Y-%m-%d")
    for i, item in enumerate(items):
        if item.get("id") in item_ids:
            items[i]["times_worn"] = items[i].get("times_worn", 0) + 1
            items[i]["last_worn"] = today
    save_wardrobe(user_id, items)


def get_analytics(user_id: str) -> dict:
    """
    Generate wardrobe analytics:
    - Most worn items
    - Underutilized items
    - Category distribution
    - Fabric distribution
    - Total items
    """
    items = load_wardrobe(user_id)
    if not items:
        return {"total": 0, "most_worn": [], "underutilized": [], "by_category": {}, "by_fabric": {}}

    sorted_by_worn = sorted(items, key=lambda x: x.get("times_worn", 0), reverse=True)

    most_worn = sorted_by_worn[:5]
    underutilized = [i for i in items if i.get("times_worn", 0) <= 3][:5]

    by_category = {}
    by_fabric = {}
    for item in items:
        cat = item.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + 1
        fabric = item.get("fabric", "unknown")
        by_fabric[fabric] = by_fabric.get(fabric, 0) + 1

    total_wears = sum(i.get("times_worn", 0) for i in items)

    return {
        "total": len(items),
        "total_wears": total_wears,
        "most_worn": [{"id": i["id"], "name": i["name"], "times_worn": i.get("times_worn", 0)} for i in most_worn],
        "underutilized": [{"id": i["id"], "name": i["name"], "times_worn": i.get("times_worn", 0)} for i in underutilized],
        "by_category": by_category,
        "by_fabric": by_fabric,
        "wear_distribution": [
            {"name": i["name"], "times_worn": i.get("times_worn", 0), "category": i.get("category", "other")}
            for i in sorted_by_worn[:10]
        ]
    }
