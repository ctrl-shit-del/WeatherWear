/**
 * WeatherWear — Outfit Database Module
 * Data is inlined to avoid CORS issues when opened as a local file.
 */

const OutfitDB = (() => {
  const OUTFITS = [
    {
      "id": "o001", "name": "Arctic Layer System", "temp_range": [-30, 0], "feels_like_offset": 2,
      "conditions": ["cold", "snow", "freezing"], "occasion": ["casual", "outdoor"],
      "items": [
        { "type": "base", "name": "Merino wool thermal set", "fabric": "merino wool", "layer": 1 },
        { "type": "mid", "name": "Fleece hoodie", "fabric": "polyester fleece", "layer": 2 },
        { "type": "outer", "name": "Down-filled parka", "fabric": "nylon/down", "layer": 3 },
        { "type": "bottom", "name": "Insulated ski pants", "fabric": "polyester" },
        { "type": "shoes", "name": "Waterproof snow boots", "fabric": "leather/rubber" }
      ],
      "accessories": ["thermal beanie", "fleece-lined gloves", "thermal scarf", "hand warmers"],
      "tags": ["winter", "extreme cold", "layered", "waterproof"],
      "sustainability_score": 6, "style_score": 7, "comfort_range": [1, 3],
      "color_palette": ["#1a1a2e", "#2d4a7a", "#ffffff"],
      "shopping_links": [
        { "item": "Down Parka", "store": "The North Face", "url": "https://www.thenorthface.com", "price_range": "$200-400" },
        { "item": "Snow Boots", "store": "Sorel", "url": "https://www.sorel.com", "price_range": "$150-250" }
      ]
    },
    {
      "id": "o002", "name": "Winter Chic", "temp_range": [0, 5], "feels_like_offset": 2,
      "conditions": ["cold", "snow", "overcast"], "occasion": ["casual", "work"],
      "items": [
        { "type": "top", "name": "Chunky turtleneck sweater", "fabric": "wool blend", "layer": 1 },
        { "type": "outer", "name": "Long wool coat", "fabric": "wool", "layer": 2 },
        { "type": "bottom", "name": "Thermal-lined trousers", "fabric": "wool blend" },
        { "type": "shoes", "name": "Ankle boots", "fabric": "leather" }
      ],
      "accessories": ["cashmere scarf", "leather gloves", "wool beret"],
      "tags": ["winter", "cold", "stylish", "work-ready"],
      "sustainability_score": 7, "style_score": 9, "comfort_range": [2, 4],
      "color_palette": ["#2c2c2c", "#8b7355", "#f5f0e8"],
      "shopping_links": [
        { "item": "Wool Coat", "store": "COS", "url": "https://www.cos.com", "price_range": "$150-300" },
        { "item": "Cashmere Scarf", "store": "Uniqlo", "url": "https://www.uniqlo.com", "price_range": "$30-80" }
      ]
    },
    {
      "id": "o003", "name": "Cozy Weekend", "temp_range": [5, 10], "feels_like_offset": 1,
      "conditions": ["cold", "overcast", "light_rain"], "occasion": ["casual", "home"],
      "items": [
        { "type": "top", "name": "Oversized knit sweater", "fabric": "cashmere blend", "layer": 1 },
        { "type": "outer", "name": "Puffer vest", "fabric": "nylon/down", "layer": 2 },
        { "type": "bottom", "name": "Slim-fit dark jeans", "fabric": "denim" },
        { "type": "shoes", "name": "Chelsea boots", "fabric": "leather" }
      ],
      "accessories": ["knit beanie", "thin scarf"],
      "tags": ["winter", "casual", "cozy", "layered"],
      "sustainability_score": 7, "style_score": 8, "comfort_range": [3, 5],
      "color_palette": ["#4a4a4a", "#8b6914", "#e8d5b7"],
      "shopping_links": [
        { "item": "Knit Sweater", "store": "Zara", "url": "https://www.zara.com", "price_range": "$50-120" },
        { "item": "Chelsea Boots", "store": "ASOS", "url": "https://www.asos.com", "price_range": "$60-150" }
      ]
    },
    {
      "id": "o004", "name": "Rainy Day Urban", "temp_range": [5, 15], "feels_like_offset": 0,
      "conditions": ["rain", "drizzle", "cold"], "occasion": ["casual", "work", "outdoor"],
      "items": [
        { "type": "top", "name": "Long-sleeve moisture-wick shirt", "fabric": "technical fabric", "layer": 1 },
        { "type": "outer", "name": "Waterproof trench coat", "fabric": "Gore-Tex/cotton blend", "layer": 2 },
        { "type": "bottom", "name": "Waterproof chinos", "fabric": "cotton/polyester" },
        { "type": "shoes", "name": "Waterproof leather oxfords", "fabric": "leather/rubber sole" }
      ],
      "accessories": ["compact umbrella", "waterproof tote bag", "light scarf"],
      "tags": ["rainy", "urban", "functional", "work-ready"],
      "sustainability_score": 6, "style_score": 8, "comfort_range": [3, 6],
      "color_palette": ["#2d3436", "#636e72", "#b2bec3"],
      "shopping_links": [
        { "item": "Trench Coat", "store": "Burberry", "url": "https://uk.burberry.com", "price_range": "$300-1200" },
        { "item": "Waterproof Shoes", "store": "Ecco", "url": "https://www.ecco.com", "price_range": "$150-250" }
      ]
    },
    {
      "id": "o005", "name": "Cool Breeze Casual", "temp_range": [10, 16], "feels_like_offset": -1,
      "conditions": ["cool", "breezy", "partly_cloudy"], "occasion": ["casual", "weekend"],
      "items": [
        { "type": "top", "name": "Classic white Oxford shirt", "fabric": "cotton", "layer": 1 },
        { "type": "outer", "name": "Denim jacket", "fabric": "denim", "layer": 2 },
        { "type": "bottom", "name": "Slim chinos", "fabric": "cotton blend" },
        { "type": "shoes", "name": "White canvas sneakers", "fabric": "canvas/rubber" }
      ],
      "accessories": ["light scarf", "crossbody bag"],
      "tags": ["spring", "fall", "casual", "minimalist"],
      "sustainability_score": 7, "style_score": 8, "comfort_range": [5, 7],
      "color_palette": ["#ffffff", "#4a90d9", "#f5f5f5"],
      "shopping_links": [
        { "item": "Oxford Shirt", "store": "Ralph Lauren", "url": "https://www.ralphlauren.com", "price_range": "$80-150" },
        { "item": "Canvas Sneakers", "store": "Converse", "url": "https://www.converse.com", "price_range": "$60-90" }
      ]
    },
    {
      "id": "o006", "name": "Smart Spring", "temp_range": [13, 18], "feels_like_offset": -1,
      "conditions": ["mild", "partly_cloudy", "breezy"], "occasion": ["work", "smart_casual"],
      "items": [
        { "type": "top", "name": "Linen blend shirt", "fabric": "linen/cotton blend", "layer": 1 },
        { "type": "outer", "name": "Lightweight blazer", "fabric": "cotton blend", "layer": 2 },
        { "type": "bottom", "name": "Tailored trousers", "fabric": "wool blend" },
        { "type": "shoes", "name": "Loafers", "fabric": "leather" }
      ],
      "accessories": ["pocket square", "leather belt", "watch"],
      "tags": ["spring", "smart", "work", "polished"],
      "sustainability_score": 7, "style_score": 9, "comfort_range": [5, 7],
      "color_palette": ["#e8d5b7", "#8b7355", "#2c3e50"],
      "shopping_links": [
        { "item": "Blazer", "store": "Massimo Dutti", "url": "https://www.massimodutti.com", "price_range": "$120-200" },
        { "item": "Loafers", "store": "Tod's", "url": "https://www.tods.com", "price_range": "$300-500" }
      ]
    },
    {
      "id": "o007", "name": "Golden Hour Look", "temp_range": [18, 24], "feels_like_offset": 0,
      "conditions": ["sunny", "warm", "clear"], "occasion": ["casual", "date", "weekend"],
      "items": [
        { "type": "top", "name": "Fitted crew-neck tee", "fabric": "organic cotton", "layer": 1 },
        { "type": "outer", "name": "Light cotton overshirt", "fabric": "cotton", "layer": 2 },
        { "type": "bottom", "name": "Straight-leg jeans", "fabric": "denim" },
        { "type": "shoes", "name": "Leather sneakers", "fabric": "leather" }
      ],
      "accessories": ["sunglasses", "canvas tote", "minimalist watch"],
      "tags": ["spring", "summer", "casual", "everyday"],
      "sustainability_score": 8, "style_score": 8, "comfort_range": [6, 8],
      "color_palette": ["#f4a460", "#87ceeb", "#ffffff"],
      "shopping_links": [
        { "item": "Organic Cotton Tee", "store": "Patagonia", "url": "https://www.patagonia.com", "price_range": "$35-60" },
        { "item": "Leather Sneakers", "store": "Common Projects", "url": "https://www.commonprojects.com", "price_range": "$200-400" }
      ]
    },
    {
      "id": "o008", "name": "Summer Breeze", "temp_range": [22, 28], "feels_like_offset": 0,
      "conditions": ["sunny", "warm", "light_breeze"], "occasion": ["casual", "beach", "outdoor"],
      "items": [
        { "type": "top", "name": "Linen short-sleeve shirt", "fabric": "linen", "layer": 1 },
        { "type": "bottom", "name": "Chino shorts", "fabric": "cotton" },
        { "type": "shoes", "name": "Canvas slip-ons", "fabric": "canvas/rubber" }
      ],
      "accessories": ["sunglasses", "caps/hat", "sunscreen", "light tote"],
      "tags": ["summer", "hot", "casual", "breathable"],
      "sustainability_score": 8, "style_score": 7, "comfort_range": [7, 9],
      "color_palette": ["#ffeaa7", "#81ecec", "#74b9ff"],
      "shopping_links": [
        { "item": "Linen Shirt", "store": "H&M", "url": "https://www.hm.com", "price_range": "$20-50" },
        { "item": "Chino Shorts", "store": "Gap", "url": "https://www.gap.com", "price_range": "$30-60" }
      ]
    },
    {
      "id": "o009", "name": "Heatwave Ready", "temp_range": [28, 45], "feels_like_offset": 1,
      "conditions": ["hot", "sunny", "humid"], "occasion": ["casual", "outdoor"],
      "items": [
        { "type": "top", "name": "Sleeveless moisture-wicking tank", "fabric": "bamboo/polyester blend", "layer": 1 },
        { "type": "bottom", "name": "Linen drawstring pants", "fabric": "linen" },
        { "type": "shoes", "name": "Leather sandals", "fabric": "leather" }
      ],
      "accessories": ["wide-brim sun hat", "UV-protection sunglasses", "reef-safe sunscreen", "cooling towel"],
      "tags": ["summer", "extreme heat", "breathable", "UV-protection"],
      "sustainability_score": 8, "style_score": 7, "comfort_range": [8, 10],
      "color_palette": ["#ffffff", "#ffeaa7", "#00b894"],
      "shopping_links": [
        { "item": "Moisture-Wick Tank", "store": "Uniqlo", "url": "https://www.uniqlo.com", "price_range": "$15-30" },
        { "item": "Linen Pants", "store": "Zara", "url": "https://www.zara.com", "price_range": "$40-80" }
      ]
    },
    {
      "id": "o010", "name": "Autumn Layers", "temp_range": [10, 17], "feels_like_offset": -1,
      "conditions": ["cool", "windy", "partly_cloudy"], "occasion": ["casual", "outdoor", "weekend"],
      "items": [
        { "type": "top", "name": "Striped Breton sweater", "fabric": "cotton", "layer": 1 },
        { "type": "outer", "name": "Waxed cotton field jacket", "fabric": "waxed cotton", "layer": 2 },
        { "type": "bottom", "name": "Dark wash slim jeans", "fabric": "denim" },
        { "type": "shoes", "name": "Desert boots", "fabric": "suede/rubber" }
      ],
      "accessories": ["knit scarf", "leather gloves"],
      "tags": ["autumn", "fall", "casual", "layered"],
      "sustainability_score": 7, "style_score": 9, "comfort_range": [5, 7],
      "color_palette": ["#d35400", "#8b4513", "#2c3e50"],
      "shopping_links": [
        { "item": "Breton Sweater", "store": "Saint James", "url": "https://www.saint-james.fr", "price_range": "$80-150" },
        { "item": "Desert Boots", "store": "Clarks", "url": "https://www.clarks.com", "price_range": "$100-180" }
      ]
    },
    {
      "id": "o011", "name": "Storm Gear", "temp_range": [0, 15], "feels_like_offset": 2,
      "conditions": ["thunderstorm", "heavy_rain", "snow", "blizzard"], "occasion": ["outdoor", "commute"],
      "items": [
        { "type": "base", "name": "Moisture-wicking base layer", "fabric": "merino wool", "layer": 1 },
        { "type": "mid", "name": "Insulating mid-layer", "fabric": "fleece", "layer": 2 },
        { "type": "outer", "name": "Waterproof hardshell jacket", "fabric": "Gore-Tex", "layer": 3 },
        { "type": "bottom", "name": "Waterproof over-trousers", "fabric": "nylon" },
        { "type": "shoes", "name": "Waterproof hiking boots", "fabric": "leather/Gore-Tex" }
      ],
      "accessories": ["waterproof gloves", "hood buff", "storm umbrella"],
      "tags": ["storm", "rain", "protective", "outdoor"],
      "sustainability_score": 6, "style_score": 6, "comfort_range": [2, 5],
      "color_palette": ["#2d3436", "#636e72", "#0984e3"],
      "shopping_links": [
        { "item": "Gore-Tex Jacket", "store": "Arc'teryx", "url": "https://www.arcteryx.com", "price_range": "$300-600" },
        { "item": "Hiking Boots", "store": "Merrell", "url": "https://www.merrell.com", "price_range": "$120-200" }
      ]
    },
    {
      "id": "o012", "name": "Sunday Brunch Look", "temp_range": [16, 22], "feels_like_offset": 0,
      "conditions": ["mild", "sunny", "clear"], "occasion": ["brunch", "date", "casual"],
      "items": [
        { "type": "top", "name": "Floral or pastel shirt", "fabric": "cotton", "layer": 1 },
        { "type": "bottom", "name": "High-waist wide-leg trousers", "fabric": "linen blend" },
        { "type": "shoes", "name": "Strappy block-heel sandals", "fabric": "leather" }
      ],
      "accessories": ["straw tote", "gold jewelry", "sunglasses"],
      "tags": ["spring", "summer", "casual", "feminine", "trendy"],
      "sustainability_score": 7, "style_score": 9, "comfort_range": [6, 8],
      "color_palette": ["#fd79a8", "#fdcb6e", "#00cec9"],
      "shopping_links": [
        { "item": "Floral Shirt", "store": "Anthropologie", "url": "https://www.anthropologie.com", "price_range": "$60-100" },
        { "item": "Block Heels", "store": "Mango", "url": "https://www.mango.com", "price_range": "$50-100" }
      ]
    },
    {
      "id": "o013", "name": "Business Formal Winter", "temp_range": [0, 10], "feels_like_offset": 1,
      "conditions": ["cold", "overcast"], "occasion": ["work", "formal", "meeting"],
      "items": [
        { "type": "top", "name": "Crisp white dress shirt", "fabric": "cotton", "layer": 1 },
        { "type": "mid", "name": "Fine-knit wool vest", "fabric": "merino wool", "layer": 2 },
        { "type": "outer", "name": "Structured overcoat", "fabric": "cashmere blend", "layer": 3 },
        { "type": "bottom", "name": "Slim-fit dress trousers", "fabric": "wool" },
        { "type": "shoes", "name": "Oxford brogues", "fabric": "leather" }
      ],
      "accessories": ["silk tie", "pocket square", "leather briefcase", "leather gloves"],
      "tags": ["winter", "formal", "business", "polished"],
      "sustainability_score": 8, "style_score": 10, "comfort_range": [3, 5],
      "color_palette": ["#2c3e50", "#7f8c8d", "#ecf0f1"],
      "shopping_links": [
        { "item": "Cashmere Overcoat", "store": "Brunello Cucinelli", "url": "https://www.brunellocucinelli.com", "price_range": "$1000-3000" },
        { "item": "Oxford Shoes", "store": "Church's", "url": "https://www.churchs.com", "price_range": "$400-700" }
      ]
    },
    {
      "id": "o014", "name": "Athletic Commuter", "temp_range": [8, 18], "feels_like_offset": 0,
      "conditions": ["cool", "mild", "overcast"], "occasion": ["sport", "gym", "commute"],
      "items": [
        { "type": "top", "name": "Performance zip-up hoodie", "fabric": "polyester blend", "layer": 1 },
        { "type": "bottom", "name": "Jogger pants", "fabric": "cotton/polyester" },
        { "type": "shoes", "name": "Running sneakers", "fabric": "mesh/rubber" }
      ],
      "accessories": ["wireless earbuds", "sports water bottle", "gym bag"],
      "tags": ["athleisure", "sport", "casual", "active"],
      "sustainability_score": 5, "style_score": 7, "comfort_range": [6, 8],
      "color_palette": ["#2d3436", "#00b894", "#74b9ff"],
      "shopping_links": [
        { "item": "Performance Hoodie", "store": "Nike", "url": "https://www.nike.com", "price_range": "$60-100" },
        { "item": "Running Shoes", "store": "Nike", "url": "https://www.nike.com", "price_range": "$80-160" }
      ]
    },
    {
      "id": "o015", "name": "Evening Elegance", "temp_range": [15, 25], "feels_like_offset": 0,
      "conditions": ["mild", "warm", "clear"], "occasion": ["dinner", "party", "event"],
      "items": [
        { "type": "top", "name": "Silk blouse or button-down", "fabric": "silk/satin", "layer": 1 },
        { "type": "outer", "name": "Tailored blazer", "fabric": "crepe/wool blend", "layer": 2 },
        { "type": "bottom", "name": "Straight-cut midi skirt or tailored trousers", "fabric": "satin/wool" },
        { "type": "shoes", "name": "Heeled pumps or dressy loafers", "fabric": "leather/suede" }
      ],
      "accessories": ["clutch bag", "statement jewelry", "perfume"],
      "tags": ["evening", "elegant", "formal", "date night"],
      "sustainability_score": 7, "style_score": 10, "comfort_range": [6, 8],
      "color_palette": ["#2c3e50", "#8e44ad", "#f5f0e8"],
      "shopping_links": [
        { "item": "Silk Blouse", "store": "Equipment", "url": "https://www.equipmentfr.com", "price_range": "$150-300" },
        { "item": "Pumps", "store": "Stuart Weitzman", "url": "https://www.stuartweitzman.com", "price_range": "$200-450" }
      ]
    },
    {
      "id": "o016", "name": "Boho Festival", "temp_range": [20, 30], "feels_like_offset": 0,
      "conditions": ["warm", "sunny", "hot"], "occasion": ["festival", "outdoor", "casual"],
      "items": [
        { "type": "top", "name": "Crochet or embroidered top", "fabric": "cotton", "layer": 1 },
        { "type": "bottom", "name": "Flowy maxi skirt or bell-bottom jeans", "fabric": "cotton/denim" },
        { "type": "shoes", "name": "Ankle strap sandals", "fabric": "leather" }
      ],
      "accessories": ["flower crown or headband", "layered necklaces", "fringe bag", "sunglasses"],
      "tags": ["summer", "boho", "festival", "trendy"],
      "sustainability_score": 7, "style_score": 9, "comfort_range": [7, 9],
      "color_palette": ["#fdcb6e", "#e17055", "#fd79a8"],
      "shopping_links": [
        { "item": "Boho Top", "store": "Free People", "url": "https://www.freepeople.com", "price_range": "$50-120" },
        { "item": "Ankle Sandals", "store": "Steve Madden", "url": "https://www.stevemadden.com", "price_range": "$60-100" }
      ]
    },
    {
      "id": "o017", "name": "Monochrome Minimalist", "temp_range": [14, 22], "feels_like_offset": 0,
      "conditions": ["mild", "clear", "partly_cloudy"], "occasion": ["casual", "work", "urban"],
      "items": [
        { "type": "top", "name": "Fitted mock-neck tee", "fabric": "pima cotton", "layer": 1 },
        { "type": "outer", "name": "Oversized blazer (matching)", "fabric": "wool blend", "layer": 2 },
        { "type": "bottom", "name": "Wide-leg tailored trousers (matching)", "fabric": "wool blend" },
        { "type": "shoes", "name": "Minimalist white sneakers", "fabric": "leather" }
      ],
      "accessories": ["minimal tote", "small gold earrings"],
      "tags": ["minimalist", "monochrome", "trendy", "urban"],
      "sustainability_score": 7, "style_score": 10, "comfort_range": [6, 8],
      "color_palette": ["#2c2c2c", "#f5f5f5", "#b2bec3"],
      "shopping_links": [
        { "item": "Oversized Blazer Set", "store": "COS", "url": "https://www.cos.com", "price_range": "$150-250" }
      ]
    },
    {
      "id": "o018", "name": "Streetwear Statement", "temp_range": [10, 20], "feels_like_offset": 0,
      "conditions": ["cool", "mild", "overcast"], "occasion": ["casual", "urban", "weekend"],
      "items": [
        { "type": "top", "name": "Graphic oversized hoodie", "fabric": "heavyweight cotton", "layer": 1 },
        { "type": "outer", "name": "Vintage bomber jacket", "fabric": "nylon/wool", "layer": 2 },
        { "type": "bottom", "name": "Cargo pants", "fabric": "cotton twill" },
        { "type": "shoes", "name": "Chunky high-top sneakers", "fabric": "canvas/rubber" }
      ],
      "accessories": ["snapback cap", "crossbody bag", "chunky chain"],
      "tags": ["streetwear", "urban", "casual", "trendy"],
      "sustainability_score": 5, "style_score": 9, "comfort_range": [6, 8],
      "color_palette": ["#2d3436", "#d63031", "#fdcb6e"],
      "shopping_links": [
        { "item": "Graphic Hoodie", "store": "Supreme", "url": "https://www.supremenewyork.com", "price_range": "$80-200" },
        { "item": "Cargo Pants", "store": "Carhartt", "url": "https://www.carhartt.com", "price_range": "$60-100" }
      ]
    },
    {
      "id": "o019", "name": "Eco Warrior", "temp_range": [12, 22], "feels_like_offset": 0,
      "conditions": ["mild", "cool", "partly_cloudy"], "occasion": ["casual", "outdoor", "weekend"],
      "items": [
        { "type": "top", "name": "Organic cotton henley", "fabric": "GOTS-certified organic cotton", "layer": 1 },
        { "type": "outer", "name": "Recycled fleece jacket", "fabric": "recycled polyester", "layer": 2 },
        { "type": "bottom", "name": "Hemp-blend chinos", "fabric": "hemp/organic cotton" },
        { "type": "shoes", "name": "Cork-sole sneakers", "fabric": "natural rubber/cork" }
      ],
      "accessories": ["bamboo fiber cap", "recycled canvas bag"],
      "tags": ["sustainable", "eco-friendly", "casual", "outdoor"],
      "sustainability_score": 10, "style_score": 7, "comfort_range": [5, 8],
      "color_palette": ["#00b894", "#55efc4", "#2d3436"],
      "shopping_links": [
        { "item": "Organic Henley", "store": "Patagonia", "url": "https://www.patagonia.com", "price_range": "$50-80" },
        { "item": "Recycled Fleece", "store": "Patagonia", "url": "https://www.patagonia.com", "price_range": "$100-180" }
      ]
    },
    {
      "id": "o020", "name": "Night Out Grunge", "temp_range": [10, 20], "feels_like_offset": 0,
      "conditions": ["cool", "mild", "clear"], "occasion": ["party", "concert", "evening"],
      "items": [
        { "type": "top", "name": "Band tee or mesh crop top", "fabric": "cotton/mesh", "layer": 1 },
        { "type": "outer", "name": "Leather or faux-leather jacket", "fabric": "leather/vegan leather", "layer": 2 },
        { "type": "bottom", "name": "Black ripped jeans or mini skirt", "fabric": "denim" },
        { "type": "shoes", "name": "Platform boots", "fabric": "leather/synthetic" }
      ],
      "accessories": ["choker", "cross-body chain bag", "dark lipstick"],
      "tags": ["edgy", "grunge", "evening", "concert"],
      "sustainability_score": 5, "style_score": 9, "comfort_range": [6, 8],
      "color_palette": ["#2c2c2c", "#6c5ce7", "#d63031"],
      "shopping_links": [
        { "item": "Leather Jacket", "store": "AllSaints", "url": "https://www.allsaints.com", "price_range": "$200-400" },
        { "item": "Platform Boots", "store": "Dr. Martens", "url": "https://www.drmartens.com", "price_range": "$150-250" }
      ]
    }
  ];

  function filterByTemp(outfits, temp) {
    return outfits.filter(o => temp >= o.temp_range[0] && temp <= o.temp_range[1]);
  }

  function filterByCondition(outfits, conditionTags) {
    return outfits.filter(o => {
      if (!o.conditions || o.conditions.length === 0) return true;
      return o.conditions.some(c => conditionTags.includes(c));
    });
  }

  function filterByOccasion(outfits, occasions) {
    if (!occasions || occasions.length === 0) return outfits;
    return outfits.filter(o => o.occasion.some(occ => occasions.includes(occ)));
  }

  async function load() { return OUTFITS; } // async to match original interface
  function getAll() { return OUTFITS; }
  function getById(id) { return OUTFITS.find(o => o.id === id); }

  return { load, getAll, getById, filterByTemp, filterByCondition, filterByOccasion };
})();
