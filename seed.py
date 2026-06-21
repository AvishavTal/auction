# /// script
# dependencies = ["requests", "Pillow"]
# ///

import requests
from PIL import Image, ImageDraw, ImageFont
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8080/api"

items = [
    # Electronics (category 1)
    {"title": "אייפון 14 פרו",           "keyword": "iphone",            "category": 1},
    {"title": "אוזניות סוני WH-1000XM5", "keyword": "headphones",        "category": 1},
    {"title": "מקבוק אייר M2",           "keyword": "macbook",           "category": 1},
    {"title": "מצלמה קנון EOS R50",      "keyword": "camera",            "category": 1},
    {"title": "טלוויזיה סמסונג 4K",      "keyword": "television",        "category": 1},
    {"title": "נינטנדו סוויץ' OLED",     "keyword": "nintendo",          "category": 1},
    {"title": "שלט פלייסטיישן 5",        "keyword": "gaming controller", "category": 1},
    {"title": "מצלמת גו-פרו הירו 11",    "keyword": "gopro",             "category": 1},
    {"title": "קינדל פייפרווייט",        "keyword": "kindle",            "category": 1},
    {"title": "אפל ווטש סדרה 8",         "keyword": "smartwatch",        "category": 1},

    # Collectibles (category 2)
    {"title": "שעון רולקס וינטג'",       "keyword": "rolex watch",       "category": 2},
    {"title": "קלפי בייסבול משנות ה-70", "keyword": "baseball cards",    "category": 2},
    {"title": "אוסף מטבעות נדירים",      "keyword": "coins collection",  "category": 2},
    {"title": "מצפן עתיק",               "keyword": "antique compass",   "category": 2},
    {"title": "אלבום בולים",             "keyword": "stamps collection", "category": 2},
    {"title": "כדור חתום על ידי שחקן",   "keyword": "signed football",   "category": 2},
    {"title": "תקליטי וינייל קלאסיים",   "keyword": "vinyl records",     "category": 2},
    {"title": "מפה עתיקה של ישראל",      "keyword": "antique map",       "category": 2},
    {"title": "ספר מהדורה ראשונה",       "keyword": "old book",          "category": 2},
    {"title": "פוסטר סרט וינטג'",        "keyword": "movie poster",      "category": 2},

    # Fashion (category 3)
    {"title": "ז'קט עור איכותי",         "keyword": "leather jacket",    "category": 3},
    {"title": "תיק יד ממותג",            "keyword": "designer handbag",  "category": 3},
    {"title": "ג'ינס לוויס וינטג'",      "keyword": "denim jeans",       "category": 3},
    {"title": "צעיף משי",                "keyword": "silk scarf",        "category": 3},
    {"title": "נעלי ספורט רטרו",         "keyword": "sneakers",          "category": 3},
    {"title": "שרשרת זהב",              "keyword": "gold necklace",     "category": 3},
    {"title": "צמיד כסף",               "keyword": "silver bracelet",   "category": 3},
    {"title": "משקפי שמש וינטג'",        "keyword": "vintage sunglasses","category": 3},
    {"title": "מעיל צמר חורפי",          "keyword": "wool coat",         "category": 3},
    {"title": "שמלה רקומה",             "keyword": "embroidered dress",  "category": 3},

    # Home & Garden (category 4)
    {"title": "שולחן אוכל עץ מלא",       "keyword": "wooden dining table","category": 4},
    {"title": "מנורת עמידה וינטג'",      "keyword": "floor lamp",        "category": 4},
    {"title": "סט קרמיקה עבודת יד",      "keyword": "ceramic pottery",   "category": 4},
    {"title": "שטיח פרסי",              "keyword": "persian rug",        "category": 4},
    {"title": "מראה עתיקה",             "keyword": "antique mirror",     "category": 4},
    {"title": "סט מחבתות ברזל יצוק",    "keyword": "cast iron pan",     "category": 4},
    {"title": "מטחנת קפה וינטג'",        "keyword": "coffee grinder",    "category": 4},
    {"title": "פסל גינה",               "keyword": "garden sculpture",   "category": 4},
    {"title": "סל קש ארוג ביד",          "keyword": "woven basket",      "category": 4},
    {"title": "ציור שמן - נוף",          "keyword": "landscape painting","category": 4},

    # Toys & Hobbies (category 5)
    {"title": "לגו מילניום פלקון",        "keyword": "lego",              "category": 5},
    {"title": "אוסף בובות ברבי וינטג'",  "keyword": "barbie doll",       "category": 5},
    {"title": "מכונית שלט רחוק",         "keyword": "remote control car","category": 5},
    {"title": "לוח שחמט שיש",            "keyword": "chess set",         "category": 5},
    {"title": "אוסף קוביות רובי'ק",      "keyword": "rubiks cube",       "category": 5},

    # Art (category 6)
    {"title": "ציור אקוורל מקורי",        "keyword": "watercolor painting","category": 6},
    {"title": "פסל ברונזה",             "keyword": "bronze sculpture",   "category": 6},
    {"title": "ציור אבסטרקטי על קנבס",   "keyword": "abstract art",      "category": 6},
    {"title": "הדפס צילום אמנותי",        "keyword": "photography print", "category": 6},
    {"title": "כלי חרס עבודת יד",        "keyword": "handmade pottery",  "category": 6},
]

descriptions = [
    "מצב מעולה, כמעט לא נעשה בו שימוש. מגיע עם הקופסה המקורית.",
    "פריט נדיר ואיכותי, מתאים לאספנים ולחובבי עיצוב.",
    "הזדמנות נדירה לרכוש פריט ייחודי במחיר מצוין.",
    "שמור בקפידה לאורך השנים, במצב אסתטי מרשים.",
    "פריט וינטג' אותנטי עם היסטוריה מעניינת.",
]


COLORS = ["#4A90D9","#E67E22","#2ECC71","#9B59B6","#E74C3C","#1ABC9C","#F39C12","#3498DB"]

def make_placeholder_image(title, index):
    color = COLORS[index % len(COLORS)]
    img = Image.new("RGB", (400, 300), color)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/SFHebrew.ttf", 28)
    except Exception:
        font = ImageFont.load_default()
    # Reverse for RTL display
    draw.text((200, 130), title[::-1], fill="white", font=font, anchor="mm")
    path = f"/tmp/seed_item_{index}.jpg"
    img.save(path, "JPEG")
    return path

def upload_image(keyword, index, title):
    img_path = make_placeholder_image(title, index)

    # Upload to our backend
    with open(img_path, "rb") as f:
        upload_response = requests.post(
            f"{BASE_URL}/media/upload",
            files={"file": (f"item_{index}.jpg", f, "image/jpeg")}
        )
    upload_response.raise_for_status()
    return upload_response.json()["imagePath"]


def create_item(item, image_path, description, price, end_time):
    payload = {
        "title": item["title"],
        "description": description,
        "startingPrice": price,
        "endTime": end_time.strftime("%Y-%m-%dT%H:%M:%S"),
        "category": {"id": item["category"]},
        "images": [{"imageUrl": image_path}]
    }
    response = requests.post(f"{BASE_URL}/items", json=payload)
    response.raise_for_status()


for i, item in enumerate(items):
    index = i + 1
    description = descriptions[i % len(descriptions)]
    price = round(random.uniform(50, 1000), 2)
    end_time = datetime.now() + timedelta(days=random.randint(1, 30))

    try:
        image_path = upload_image(item["keyword"], index, item["title"])
        create_item(item, image_path, description, price, end_time)
        print(f"[{index}/50] ✓ {item['title']}")
    except Exception as e:
        print(f"[{index}/50] ✗ {item['title']} — {e}")

print("\nDone!")
