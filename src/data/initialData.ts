import { Category, DBState, Preset } from '../types/prompter';

export const INITIAL_PRESETS: Preset[] = [
  {
    id: "p1",
    name: "Cozy Knit Casual",
    kind: "outfit",
    description: "Relaxed off-shoulder knitwear and denim",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e2" },
      { cat: "outfit", sub: "bottom", el: "e1" }
    ]
  },
  {
    id: "p2",
    name: "Metropolitan Office",
    kind: "outfit",
    description: "Sharp button-up blouse and pencil skirt",
    picks: [
      { cat: "outfit", sub: "top", el: "e3" },
      { cat: "outfit", sub: "bottom", el: "e2" }
    ]
  },
  {
    id: "p3",
    name: "Night Club Glow",
    kind: "outfit",
    description: "Sequined halter top with high-slit skirt",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e13" },
      { cat: "outfit", sub: "bottom", el: "e3" }
    ]
  },
  {
    id: "p4",
    name: "Athletic Studio",
    kind: "outfit",
    description: "Sporty zip hoodie with biker shorts",
    picks: [
      { cat: "outfit", sub: "top", el: "e7" },
      { cat: "outfit", sub: "bottom", el: "e12" }
    ]
  },
  {
    id: "p5",
    name: "Urban Streetwear",
    kind: "outfit",
    description: "Knotted graphic tee and cut-off denim",
    picks: [
      { cat: "outfit", sub: "top", el: "e11" },
      { cat: "outfit", sub: "bottom", el: "e10" }
    ]
  },
  {
    id: "p6",
    name: "Lace Intimates",
    kind: "outfit",
    description: "Sheer lace bralette and matching panties",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e1" },
      { cat: "outfit", sub: "bottom", el: "e16" }
    ]
  },
  {
    id: "p7",
    name: "Sunlit Riviera Bikini",
    kind: "outfit",
    description: "Micro bikini top and high-cut bottoms",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e23" },
      { cat: "outfit", sub: "bottom", el: "e18" }
    ]
  },
  {
    id: "p8",
    name: "Artisan Cafe Afternoon",
    kind: "context",
    description: "Cozy knitwear, cafe interior, soft window gaze",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e2" },
      { cat: "outfit", sub: "bottom", el: "e1" },
      { cat: "comp", sub: "framing", el: "e1" },
      { cat: "pose", sub: "sitting", el: "e3" },
      { cat: "env", sub: "indoor", el: "e10" },
      { cat: "light", el: "e8" }
    ]
  },
  {
    id: "p9",
    name: "Morning Fitness Routine",
    kind: "context",
    description: "Modern gym studio, mirror selfie framing",
    picks: [
      { cat: "outfit", sub: "top", el: "e7" },
      { cat: "outfit", sub: "bottom", el: "e12" },
      { cat: "comp", sub: "style", el: "e0" },
      { cat: "pose", sub: "standing", el: "e8" },
      { cat: "env", sub: "indoor", el: "e14" }
    ]
  },
  {
    id: "p10",
    name: "Tokyo Rooftop at Dusk",
    kind: "context",
    description: "Night city backdrop, neon rim lighting",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e13" },
      { cat: "outfit", sub: "bottom", el: "e3" },
      { cat: "comp", sub: "framing", el: "e0" },
      { cat: "pose", sub: "standing", el: "e3" },
      { cat: "env", sub: "outdoor", el: "e1" },
      { cat: "light", el: "e2" }
    ]
  },
  {
    id: "p11",
    name: "Editorial Shopping Haul",
    kind: "context",
    description: "Candid walking shot in boutique mall",
    picks: [
      { cat: "outfit", sub: "top", el: "e11" },
      { cat: "outfit", sub: "bottom", el: "e10" },
      { cat: "comp", sub: "style", el: "e1" },
      { cat: "pose", sub: "standing", el: "e6" },
      { cat: "env", sub: "indoor", el: "e19" }
    ]
  },
  {
    id: "p12",
    name: "Golden Hour Oasis",
    kind: "context",
    description: "Sunset poolside, turquoise reflections",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e23" },
      { cat: "outfit", sub: "bottom", el: "e18" },
      { cat: "comp", sub: "framing", el: "e0" },
      { cat: "pose", sub: "standing", el: "e4" },
      { cat: "env", sub: "outdoor", el: "e3" },
      { cat: "light", el: "e1" }
    ]
  },
  {
    id: "p13",
    name: "Silk & Boudoir Sanctuary",
    kind: "context",
    description: "Intimate white bed setting with soft diffused light",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e1" },
      { cat: "outfit", sub: "bottom", el: "e16" },
      { cat: "comp", sub: "framing", el: "e1" },
      { cat: "pose", sub: "lying", el: "e0" },
      { cat: "env", sub: "indoor", el: "e0" },
      { cat: "light", el: "e0" }
    ]
  },
  {
    id: "p14",
    name: "90s Flash Disposable Street",
    kind: "context",
    description: "Vintage candid night street snapshot",
    nsfw: true,
    picks: [
      { cat: "style", el: "e9" },
      { cat: "outfit", sub: "top", el: "e11" },
      { cat: "outfit", sub: "bottom", el: "e1" },
      { cat: "light", el: "e18" },
      { cat: "tech", el: "e3" }
    ]
  },
  {
    id: "p15",
    name: "Extreme Vinyl Siren",
    kind: "outfit",
    description: "Glossy vinyl bodysuit and wet-look tights",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e17" },
      { cat: "outfit", sub: "bottom", el: "e19" }
    ]
  },
  {
    id: "p16",
    name: "Boudoir Velvet Nocturne",
    kind: "context",
    description: "Sensual boudoir study with low chiaroscuro lighting",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e15" },
      { cat: "outfit", sub: "bottom", el: "e14" },
      { cat: "pose", sub: "lying", el: "e0" },
      { cat: "light", el: "e0" }
    ]
  },
  {
    id: "p17",
    name: "Sheer Mesh Decadence",
    kind: "outfit",
    description: "Transparent mesh corset top and scalloped lace panties",
    nsfw: true,
    picks: [
      { cat: "outfit", sub: "top", el: "e29" },
      { cat: "outfit", sub: "bottom", el: "e16" }
    ]
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "style",
    name: "Style & Aesthetic",
    type: "flat",
    icon: "Palette",
    accent: "#ff6b2c",
    description: "Photographic genre, film stock, and directorial visual tone",
    els: [
      {
        id: "e0",
        name: "Glamour Half-Body Portrait",
        prompt: "High-resolution photorealistic glamour portrait, framed from waist up, polished editorial lighting, razor-sharp focus.",
        nsfw: false
      },
      {
        id: "e1",
        name: "High-Fashion Editorial",
        prompt: "Vogue-grade high-fashion editorial photography, controlled studio strobes, sculptural shadows, crisp tactile garment detail.",
        nsfw: false
      },
      {
        id: "e2",
        name: "Cinematic Film Still",
        prompt: "35mm anamorphic cinematic film still, subtle anamorphic streak flare, shallow depth of field, Kodachrome color tone curve.",
        nsfw: false
      },
      {
        id: "e3",
        name: "Candid Street Photography",
        prompt: "Authentic candid street photography, natural kinetic energy, unposed organic moment, ambient urban reflections.",
        nsfw: false
      },
      {
        id: "e4",
        name: "Studio Beauty Portrait",
        prompt: "Clean studio beauty portrait, pristine skin pores, soft silver reflector fill, commercial magazine advertising finish.",
        nsfw: false
      },
      {
        id: "e5",
        name: "Boudoir Photography",
        prompt: "Intimate boudoir fine-art photography, soft chiaroscuro illumination, romantic tactile atmosphere, delicate tonal depth.",
        nsfw: false
      },
      {
        id: "e6",
        name: "Full-Body Fashion Lookbook",
        prompt: "Clean full-body fashion lookbook photography, neutral cyclorama backdrop, crisp balanced editorial illumination.",
        nsfw: false
      },
      {
        id: "e7",
        name: "Natural Smartphone Selfie",
        prompt: "Casual handheld smartphone selfie, authentic front-facing camera optics, genuine ambient indoor light, candid framing.",
        nsfw: false
      },
      {
        id: "e8",
        name: "Noir Black-and-White",
        prompt: "High-contrast monochrome noir portrait, sculpted Venetian blind shadow stripes, deep obsidian blacks, fine silver halide grain.",
        nsfw: false
      },
      {
        id: "e9",
        name: "Analog 35mm Vintage Film",
        prompt: "Photorealistic vintage 35mm film photography, organic analog grain, subtle pastel highlight halation, authentic Kodak Portra character.",
        nsfw: false
      },
      {
        id: "e10",
        name: "Commercial Advertising",
        prompt: "High-end commercial brand campaign photography, tack-sharp edge rendering, calibrated studio illumination, pristine clarity.",
        nsfw: false
      },
      {
        id: "e11",
        name: "Documentary Photojournalism",
        prompt: "Magnum-style documentary photography, authentic raw moment, natural unmanipulated lighting, rich documentary texture.",
        nsfw: false
      },
      {
        id: "e12",
        name: "High-Fashion Runway",
        prompt: "Paris Fashion Week runway photography, dynamic forward stride, telephoto compression, sharp flash on catwalk.",
        nsfw: false
      },
      {
        id: "e13",
        name: "Soft Glamour Sensual",
        prompt: "Soft glamour photography, sensual styling, flattering ambient rim glow, refined editorial elegance.",
        nsfw: true
      },
      {
        id: "e14",
        name: "Fine-Art Sculptural Study",
        prompt: "Fine-art sculptural nude study, museum-grade chiaroscuro lighting, classical proportion, artistic silhouette balance.",
        nsfw: true
      },
      {
        id: "e15",
        name: "Vintage Polaroid 600",
        prompt: "Authentic Polaroid 600 instant film print, creamy faded cyan shadows, gentle chemical vignette, vintage analog warmth.",
        nsfw: false
      },
      {
        id: "e16",
        name: "Natural Lifestyle Everyday",
        prompt: "Contemporary lifestyle photography, candid natural movement, authentic human warmth, soft environmental storytelling.",
        nsfw: false
      },
      {
        id: "e17",
        name: "Modernist Architectural Portrait",
        prompt: "Bauhaus-inspired modernist portrait, stark geometric framing, bold negative space, crisp architectural shadow play.",
        nsfw: false
      },
      {
        id: "e18",
        name: "Paparazzi Direct Flash",
        prompt: "Authentic paparazzi candid snapshot, direct on-camera flash, spontaneous head-turn, motion-blurred red carpet perimeter.",
        nsfw: false
      },
      {
        id: "e19",
        name: "Ethereal Pictorialist",
        prompt: "Pictorialist art photography, gentle diffused glow, painterly tonal graduation, dreamlike romantic softness.",
        nsfw: false
      },
      {
        id: "e20",
        name: "Cyberpunk Neo-Tokyo",
        prompt: "Neo-Tokyo cyberpunk aesthetic, rainy asphalt reflections, cyan and hot magenta neon backlighting, atmospheric vapor.",
        nsfw: false
      }
    ]
  },
  {
    id: "subject",
    name: "Subject & Persona",
    type: "tabs",
    icon: "User",
    accent: "#ff8a3d",
    description: "Curated model presets or custom persona builder (ethnicity, age, physique, hair)",
    subcats: [
      {
        id: "general",
        name: "Curated Models",
        type: "flat",
        els: [
          {
            id: "e0",
            name: "19-Year-Old Asian Woman — Hourglass",
            prompt: "A 19-year-old Asian woman with a natural hourglass figure and silky obsidian black hair, realistic delicate facial proportions.",
            nsfw: false
          },
          {
            id: "e1",
            name: "21-Year-Old Asian Woman — Athletic",
            prompt: "A 21-year-old Asian woman with an athletic toned figure and shoulder-length chestnut brown hair, glowing warm skin tone.",
            nsfw: false
          },
          {
            id: "e2",
            name: "23-Year-Old Asian Woman — Slim Chic",
            prompt: "A 23-year-old Asian woman with a slim graceful figure and honey blonde highlighted hair, elegant high cheekbones.",
            nsfw: false
          },
          {
            id: "e3",
            name: "25-Year-Old Caucasian Woman — Toned",
            prompt: "A 25-year-old Caucasian woman with a toned athletic figure, wavy sun-bleached blonde hair, light freckles over nose bridge.",
            nsfw: false
          },
          {
            id: "e4",
            name: "22-Year-Old Caucasian Woman — Curvy",
            prompt: "A 22-year-old Caucasian woman with a voluptuous hourglass figure, natural auburn red waves, striking hazel eyes.",
            nsfw: false
          },
          {
            id: "e5",
            name: "26-Year-Old Caucasian Woman — Petite",
            prompt: "A 26-year-old Caucasian woman with a petite slender build, sleek platinum blonde bob, delicate facial symmetry.",
            nsfw: false
          },
          {
            id: "e6",
            name: "24-Year-Old Latina Woman — Hourglass",
            prompt: "A 24-year-old Latina woman with an hourglass figure, long cascading dark chocolate curls, luminous sun-kissed golden skin.",
            nsfw: false
          },
          {
            id: "e7",
            name: "22-Year-Old Latina Woman — Athletic",
            prompt: "A 22-year-old Latina woman with a toned athletic physique, high ponytail, warm olive complexion, radiant smile.",
            nsfw: false
          },
          {
            id: "e8",
            name: "25-Year-Old Black Woman — Sculpted",
            prompt: "A 25-year-old Black woman with a sculpted athletic hourglass figure, intricate micro braids, rich radiant ebony complexion.",
            nsfw: false
          },
          {
            id: "e9",
            name: "23-Year-Old Black Woman — Curvy",
            prompt: "A 23-year-old Black woman with a voluptuous feminine silhouette, natural textured afro crown, warm caramel undertones.",
            nsfw: false
          },
          {
            id: "e10",
            name: "24-Year-Old Middle Eastern Woman — Hourglass",
            prompt: "A 24-year-old Middle Eastern woman with an hourglass figure, deep almond eyes, arched eyebrows, thick glossy dark waves.",
            nsfw: false
          },
          {
            id: "e11",
            name: "22-Year-Old South Asian Woman — Graceful",
            prompt: "A 22-year-old South Asian woman with a slim graceful silhouette, long lustrous dark braid, radiant warm bronze complexion.",
            nsfw: false
          },
          {
            id: "e12",
            name: "23-Year-Old Scandinavian Woman — Tall Slim",
            prompt: "A 23-year-old Scandinavian woman with a tall slim frame, straight icy blonde hair, cool grey-blue eyes, porcelain complexion.",
            nsfw: false
          },
          {
            id: "e13",
            name: "24-Year-Old Mediterranean Woman — Olive Glow",
            prompt: "A 24-year-old Mediterranean woman with an athletic curvy figure, tousled dark brunette waves, natural olive skin.",
            nsfw: false
          },
          {
            id: "e14",
            name: "21-Year-Old Korean Woman — Idol Aesthetic",
            prompt: "A 21-year-old Korean woman with a slim waist, soft pastel pink curtain bangs, luminous dewy glass skin finish.",
            nsfw: false
          },
          {
            id: "e15",
            name: "25-Year-Old Mixed Race Woman — Sun-Kissed",
            prompt: "A 25-year-old Mixed-race woman with an athletic hourglass physique, honey-brown ringlets, captivating amber eyes.",
            nsfw: false
          },
          {
            id: "e16",
            name: "26-Year-Old Slavic Woman — High Cheekbones",
            prompt: "A 26-year-old Slavic woman with razor-sharp cheekbones, long ash-blonde hair, piercing steel blue eyes, toned proportions.",
            nsfw: false
          },
          {
            id: "e17",
            name: "27-Year-Old Afro-Latina Woman — Curvy",
            prompt: "A 27-year-old Afro-Latina woman with a curvy feminine build, golden-bronze skin, defined jawline, deep dark brown curls.",
            nsfw: false
          }
        ]
      },
      {
        id: "mine",
        name: "Saved Personas",
        type: "flat",
        els: []
      },
      {
        id: "personalized",
        name: "Persona Builder",
        type: "rows",
        rows: [
          {
            id: "ethnicity",
            name: "Heritage & Ethnicity",
            els: [
              { id: "e0", name: "East Asian", prompt: "East Asian heritage woman.", nsfw: false },
              { id: "e1", name: "Caucasian / European", prompt: "Caucasian woman.", nsfw: false },
              { id: "e2", name: "Latina", prompt: "Latina woman.", nsfw: false },
              { id: "e3", name: "Black / African", prompt: "Black woman with rich radiant skin.", nsfw: false },
              { id: "e4", name: "Middle Eastern", prompt: "Middle Eastern woman.", nsfw: false },
              { id: "e5", name: "South Asian", prompt: "South Asian woman.", nsfw: false },
              { id: "e6", name: "Mixed Race", prompt: "Mixed race woman.", nsfw: false },
              { id: "e7", name: "Scandinavian", prompt: "Scandinavian Nordic woman.", nsfw: false },
              { id: "e8", name: "Mediterranean", prompt: "Mediterranean woman.", nsfw: false },
              { id: "e9", name: "Korean", prompt: "Korean woman.", nsfw: false },
              { id: "e10", name: "Slavic", prompt: "Slavic woman.", nsfw: false },
              { id: "e11", name: "Pacific Islander", prompt: "Polynesian Pacific Islander woman.", nsfw: false }
            ]
          },
          {
            id: "age",
            name: "Age Range",
            els: [
              { id: "e0", name: "18–20 Young Adult", prompt: "Young adult woman, 19 years old.", nsfw: false },
              { id: "e1", name: "21–24 Early Twenties", prompt: "Woman in her early twenties, 22 years old.", nsfw: false },
              { id: "e2", name: "25–28 Mid Twenties", prompt: "Woman in her mid twenties, 26 years old.", nsfw: false },
              { id: "e3", name: "29–33 Late Twenties/Early Thirties", prompt: "Woman, 30 years old, confident gaze.", nsfw: false },
              { id: "e4", name: "34–40 Mature Sophisticated", prompt: "Sophisticated mature woman in her late thirties.", nsfw: false }
            ]
          },
          {
            id: "bodytype",
            name: "Physique & Build",
            els: [
              { id: "e0", name: "Hourglass Figure", prompt: "defined hourglass figure, narrow waist.", nsfw: false },
              { id: "e1", name: "Athletic Toned", prompt: "athletic toned physique with subtle core definition.", nsfw: false },
              { id: "e2", name: "Slim Slender", prompt: "slim slender model build.", nsfw: false },
              { id: "e3", name: "Curvy Feminine", prompt: "curvy feminine silhouette with soft natural contours.", nsfw: false },
              { id: "e4", name: "Petite Frame", prompt: "petite delicate frame, well-proportioned.", nsfw: false },
              { id: "e5", name: "Voluptuous", prompt: "voluptuous full figure, natural proportions.", nsfw: false },
              { id: "e6", name: "Tall Editorial", prompt: "tall statuesque editorial runway build.", nsfw: false }
            ]
          },
          {
            id: "hair",
            name: "Hair Style & Color",
            els: [
              { id: "e0", name: "Long Wavy Obsidian Black", prompt: "Long cascading wavy jet-black hair.", nsfw: false },
              { id: "e1", name: "Sleek Straight Dark Chocolate", prompt: "Silky sleek straight dark chocolate brown hair.", nsfw: false },
              { id: "e2", name: "Tousled Golden Blonde", prompt: "Tousled textured golden blonde waves.", nsfw: false },
              { id: "e3", name: "Natural Auburn Waves", prompt: "Rich vibrant auburn red wavy hair.", nsfw: false },
              { id: "e4", name: "Icy Platinum Bob", prompt: "Chic chin-length icy platinum blonde bob.", nsfw: false },
              { id: "e5", name: "Pastel Sakura Pink", prompt: "Soft pastel sakura pink hair with dark roots.", nsfw: false },
              { id: "e6", name: "Textured Natural Afro", prompt: "Defined textured natural afro curls.", nsfw: false },
              { id: "e7", name: "High Messy Bun", prompt: "High effortless messy bun with face-framing tendrils.", nsfw: false },
              { id: "e8", name: "Shoulder-Length Curtain Bangs", prompt: "Shoulder-length honey brown hair with curtain bangs.", nsfw: false },
              { id: "e9", name: "Intricate Long Box Braids", prompt: "Waist-length sleek intricate box braids.", nsfw: false }
            ]
          },
          {
            id: "skincolor",
            name: "Skin Complexion",
            els: [
              { id: "e0", name: "Porcelain Fair", prompt: "Porcelain fair skin with subtle cool undertones.", nsfw: false },
              { id: "e1", name: "Warm Ivory", prompt: "Warm ivory skin tone with natural healthy blush.", nsfw: false },
              { id: "e2", name: "Golden Sun-Kissed", prompt: "Golden sun-kissed tan skin tone.", nsfw: false },
              { id: "e3", name: "Warm Olive", prompt: "Luminous Mediterranean olive skin tone.", nsfw: false },
              { id: "e4", name: "Caramel Bronze", prompt: "Radiant warm caramel bronze skin.", nsfw: false },
              { id: "e5", name: "Deep Rich Ebony", prompt: "Deep rich ebony skin with a healthy dewy sheen.", nsfw: false }
            ]
          },
          {
            id: "other",
            name: "Distinctive Marks",
            els: [
              { id: "e0", name: "Freckles Across Nose", prompt: "Light constellation of natural freckles dusted across nose bridge and cheeks.", nsfw: false },
              { id: "e1", name: "Beauty Mark Below Eye", prompt: "Delicate beauty mark just below the left eye.", nsfw: false },
              { id: "e2", name: "Full Sleeve Botanical Tattoo", prompt: "Intricate fine-line botanical black-ink sleeve tattoo.", nsfw: false },
              { id: "e3", name: "Tiny Gold Nose Stud", prompt: "Subtle minimalist gold nose stud.", nsfw: false },
              { id: "e4", name: "Playful Cheek Dimples", prompt: "Deep charming cheek dimples when smiling.", nsfw: false },
              { id: "e5", name: "Collarbone Fine Tattoo", prompt: "Delicate minimalist script tattoo along collarbone.", nsfw: false },
              { id: "e6", name: "Heterochromia Dual Eyes", prompt: "Striking heterochromia with one emerald green eye and one warm hazel eye.", nsfw: false }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "outfit",
    name: "Outfit & Wardrobe",
    type: "tabs",
    icon: "Shirt",
    accent: "#ff3355",
    description: "Tops, bottoms, accessories, and complete coordinated attire",
    subcats: [
      {
        id: "top",
        name: "Top & Bodice",
        type: "flat",
        els: [
          { id: "e0", name: "Pinned Ribbed Crop Top", prompt: "She is wearing a white ribbed crop top fastened by a single delicate center pin", nsfw: false },
          { id: "e1", name: "Black Lace Bralette", prompt: "She is wearing an intricate black floral lace bralette", nsfw: true },
          { id: "e2", name: "Oversized Cream Knit Sweater", prompt: "She is wearing an oversized chunky cream knit sweater slipping casually off one shoulder", nsfw: false },
          { id: "e3", name: "Silk Unbuttoned Blouse", prompt: "She is wearing a tailored crisp white silk blouse, partially unbuttoned to reveal the collarbone", nsfw: false },
          { id: "e4", name: "Sheer Geometric Mesh Top", prompt: "She is wearing a sheer black mesh long-sleeve top", nsfw: true },
          { id: "e5", name: "Cropped Denim Jacket", prompt: "She is wearing a vintage cropped blue denim jacket worn over bare skin", nsfw: false },
          { id: "e6", name: "Silk Satin Cami", prompt: "She is wearing a champagne silk satin camisole with delicate spaghetti straps", nsfw: false },
          { id: "e7", name: "Athletic Crop Zip Hoodie", prompt: "She is wearing a heather grey fitted zip-up crop hoodie", nsfw: false },
          { id: "e8", name: "Cashmere Fitted Turtleneck", prompt: "She is wearing a snug ribbed black cashmere turtleneck sweater", nsfw: false },
          { id: "e9", name: "Structured Corset Bustier", prompt: "She is wearing a boned satin corset bustier with sweetheart neckline", nsfw: true },
          { id: "e10", name: "Deep Plunge Tank Top", prompt: "She is wearing a ribbed cotton tank top with a deep plunging neckline", nsfw: false },
          { id: "e11", name: "Knotted Vintage Graphic Tee", prompt: "She is wearing a washed charcoal vintage band tee tied high at the waist", nsfw: false },
          { id: "e12", name: "Draped Wrap Top", prompt: "She is wearing a draped emerald wrap blouse cinched at the side", nsfw: false },
          { id: "e13", name: "Sequined Gold Halter", prompt: "She is wearing a shimmering gold sequin backless halter top", nsfw: false },
          { id: "e14", name: "Lace Camisole Top", prompt: "She is wearing a scalloped lace-trimmed satin camisole", nsfw: true },
          { id: "e15", name: "Sheer Balconette Lace Bra", prompt: "She is wearing an unlined sheer lace balconette bra", nsfw: true },
          { id: "e16", name: "Open-Back Halter Bodysuit", prompt: "She is wearing an open-back halter bodysuit exposing the entire spine", nsfw: true },
          { id: "e17", name: "Glossy Vinyl Bodysuit Top", prompt: "She is wearing a high-gloss wet-look black vinyl bodysuit, sculpted fit", nsfw: true },
          { id: "e18", name: "Fishnet Long-Sleeve Crop", prompt: "She is wearing a delicate black fishnet crop top over bare skin", nsfw: true },
          { id: "e19", name: "Cut-Out Strappy Bralette", prompt: "She is wearing an architectural cut-out bralette with cage straps", nsfw: true },
          { id: "e20", name: "Sheer Bodystocking Top", prompt: "She is wearing a sheer gossamer bodystocking top", nsfw: true },
          { id: "e21", name: "Pasties with Body Chains", prompt: "She is wearing metallic pasties connected by delicate draping gold chains", nsfw: true },
          { id: "e22", name: "Cardigan Slid Off, No Bra", prompt: "She is wearing an unbuttoned mohair cardigan casually slid off both shoulders", nsfw: true },
          { id: "e23", name: "Micro Triangle Bikini Top", prompt: "She is wearing a metallic bronze micro triangle bikini top", nsfw: true },
          { id: "e24", name: "Silk Chiffon Open Robe", prompt: "She is wearing a sheer silk chiffon robe flowing open", nsfw: true },
          { id: "e25", name: "Leather Buckled Harness", prompt: "She is wearing a handcrafted leather harness across chest and torso", nsfw: true },
          { id: "e26", name: "Minimal String Bralette", prompt: "She is wearing a delicate minimalist string bralette", nsfw: true },
          { id: "e27", name: "Drenched Sheer White Tee", prompt: "She is wearing a translucent soaked white cotton tee clinging to the torso", nsfw: true },
          { id: "e28", name: "Asymmetric Off-Shoulder Top", prompt: "She is wearing an asymmetric off-shoulder top pulled down at one side", nsfw: true },
          { id: "e29", name: "Mesh Sheer Corset Top", prompt: "She is wearing a semi-transparent boned mesh corset top", nsfw: true }
        ]
      },
      {
        id: "bottom",
        name: "Bottom & Skirt",
        type: "flat",
        els: [
          { id: "e0", name: "Thong & Ribbed Thigh-Highs", prompt: "white thong bottoms paired with ribbed knit over-the-knee socks", nsfw: true },
          { id: "e1", name: "High-Waisted Distressed Denim Shorts", prompt: "high-waisted distressed vintage denim cutoff shorts", nsfw: false },
          { id: "e2", name: "Tailored Leather Pencil Skirt", prompt: "a sleek black leather pencil skirt hugging her hips", nsfw: false },
          { id: "e3", name: "Sequined Skirt with High Slit", prompt: "a floor-length sequined evening skirt with a daring thigh-high slit", nsfw: false },
          { id: "e4", name: "Tiny String Bikini Bottoms", prompt: "tiny side-tie string bikini bottoms", nsfw: true },
          { id: "e5", name: "Second-Skin Leather Leggings", prompt: "form-fitting supple black leather leggings", nsfw: false },
          { id: "e6", name: "Pleated Tennis Mini Skirt", prompt: "a crisp pleated tennis mini skirt", nsfw: false },
          { id: "e7", name: "Seamless Sculpting Leggings", prompt: "high-waisted seamless sculpting athletic leggings", nsfw: false },
          { id: "e8", name: "Sheer Floral Lace Skirt", prompt: "a translucent black floral lace skirt", nsfw: true },
          { id: "e9", name: "Wide-Leg Linen Trousers", prompt: "flowing wide-leg ivory linen trousers", nsfw: false },
          { id: "e10", name: "Frayed Denim Booty Shorts", prompt: "raw-hem frayed cheek denim shorts", nsfw: false },
          { id: "e11", name: "Bias-Cut Satin Slip Skirt", prompt: "a bias-cut champagne satin midi slip skirt", nsfw: false },
          { id: "e12", name: "Athletic Compression Biker Shorts", prompt: "matte black compression biker shorts", nsfw: false },
          { id: "e13", name: "Tiered Chiffon Maxi Skirt", prompt: "a breezy tiered floral chiffon maxi skirt", nsfw: false },
          { id: "e14", name: "Garter Belt & Sheer Stockings", prompt: "a vintage lace garter belt with ultra-sheer black stockings", nsfw: true },
          { id: "e15", name: "Micro Tanga Thong", prompt: "a minimalist micro tanga thong", nsfw: true },
          { id: "e16", name: "Sheer Scalloped Lace Panties", prompt: "translucent scalloped lace lingerie bottoms", nsfw: true },
          { id: "e17", name: "Crotchless Lace Thong", prompt: "delicate open-crotch lace lingerie bottoms", nsfw: true },
          { id: "e18", name: "High-Cut Brazilian Bikini Bottoms", prompt: "high-cut Brazilian cheek bikini bottoms", nsfw: true },
          { id: "e19", name: "Glossy Wet-Look Vinyl Tights", prompt: "tight high-gloss wet-look vinyl leggings", nsfw: true },
          { id: "e20", name: "Strappy Lace Thong", prompt: "a multi-strap open back lace thong", nsfw: true },
          { id: "e21", name: "Sheer Bodystocking Tights", prompt: "ultra-fine sheer bodystocking tights", nsfw: true },
          { id: "e22", name: "Ultra-Short Micro Pleated Skirt", prompt: "an ultra-short micro pleated miniskirt", nsfw: true },
          { id: "e23", name: "Matching Garter & Thong Ensemble", prompt: "a matching lace garter belt and strappy thong set", nsfw: true },
          { id: "e24", name: "High-Waist Lace Tap Pants", prompt: "cheeky vintage lace tap shorts riding high on the hips", nsfw: true },
          { id: "e25", name: "Sheer Sarong Wrap", prompt: "a semi-sheer chiffon sarong wrap", nsfw: true },
          { id: "e26", name: "Strappy Tie-Side Bottoms", prompt: "strappy double-tied bikini bottoms", nsfw: true },
          { id: "e27", name: "Fishnet Tights (No Skirt)", prompt: "fishnet tights worn over bare hips without a skirt", nsfw: true },
          { id: "e28", name: "Low-Rise Seamless G-String", prompt: "a low-rise seamless G-string", nsfw: true },
          { id: "e29", name: "Sheer Mesh Micro Skirt", prompt: "an ultra-short translucent mesh micro skirt", nsfw: true }
        ]
      },
      {
        id: "onepiece",
        name: "One-Piece",
        type: "flat",
        els: [
          { id: "op0", name: "Backless Satin Slip Dress", prompt: "She is wearing a fluid backless champagne satin slip dress with delicate straps", nsfw: false },
          { id: "op1", name: "Little Black Cocktail Dress", prompt: "She is wearing a chic tailored little black cocktail dress with a sweetheart neckline", nsfw: false },
          { id: "op2", name: "Floral Chiffon Sundress", prompt: "She is wearing a breezy pastel floral print chiffon sundress fluttering gently", nsfw: false },
          { id: "op3", name: "Sculpted Bodycon Mini Dress", prompt: "She is wearing a form-fitting ribbed knit bodycon mini dress", nsfw: false },
          { id: "op4", name: "Tailored Wide-Leg Jumpsuit", prompt: "She is wearing an elegant sleeveless black tailored jumpsuit with flowing wide-leg trousers", nsfw: false },
          { id: "op5", name: "Vintage Denim Romper", prompt: "She is wearing a belted vintage wash blue denim utility romper", nsfw: false },
          { id: "op6", name: "High-Slit Silk Evening Gown", prompt: "She is wearing an emerald green silk evening gown with a dramatic thigh-high slit", nsfw: false },
          { id: "op7", name: "Ribbed Turtleneck Sweater Dress", prompt: "She is wearing a cozy oatmeal ribbed turtleneck sweater dress", nsfw: false },
          { id: "op8", name: "Bohemian Tiered Maxi Dress", prompt: "She is wearing a breezy bohemian tiered cotton maxi dress", nsfw: false },
          { id: "op9", name: "Glossy Wet-Look Catsuit", prompt: "She is wearing a sculpted full-body black wet-look catsuit", nsfw: true },
          { id: "op10", name: "Sheer Lace Bodysuit", prompt: "She is wearing an intricate sheer floral lace one-piece bodysuit with corset boning", nsfw: true },
          { id: "op11", name: "Plunging Halter Neck Dress", prompt: "She is wearing a daring deep-plunge halter neck evening dress", nsfw: true },
          { id: "op12", name: "Cut-Out Strappy Monokini", prompt: "She is wearing an architectural one-piece monokini swimsuit with side cut-outs", nsfw: true },
          { id: "op13", name: "Metallic Mesh Club Dress", prompt: "She is wearing a shimmering metallic chainmail mesh mini dress", nsfw: true }
        ]
      },
      {
        id: "other",
        name: "Accessories & Footwear",
        type: "flat",
        els: [
          { id: "e0", name: "Strappy Stiletto Heels", prompt: "She is wearing minimalist strappy stiletto high heels", nsfw: false },
          { id: "e1", name: "Pointed Leather Ankle Boots", prompt: "She is wearing sleek pointed black leather ankle boots", nsfw: false },
          { id: "e2", name: "Barefoot Natural", prompt: "She is barefoot with natural manicured feet", nsfw: false },
          { id: "e3", name: "Crisp White Designer Sneakers", prompt: "She is wearing pristine white low-top leather sneakers", nsfw: false },
          { id: "e4", name: "Chunky Gold Hoops", prompt: "She is wearing polished chunky gold hoop earrings", nsfw: false },
          { id: "e5", name: "Layered Herringbone Necklaces", prompt: "She is wearing delicate layered gold herringbone necklaces", nsfw: false },
          { id: "e6", name: "Thin Wire-Frame Glasses", prompt: "She is wearing thin transparent architectural glasses", nsfw: false },
          { id: "e7", name: "Velvet Ribbon Choker", prompt: "She is wearing a slim black velvet ribbon choker", nsfw: false },
          { id: "e8", name: "Straw Wide-Brim Sunhat", prompt: "She is wearing a woven wide-brim straw hat", nsfw: false },
          { id: "e9", name: "Hermès Silk Scarf", prompt: "She is wearing a printed silk scarf loosely draped around the neck", nsfw: false },
          { id: "e10", name: "Mini Structured Handbag", prompt: "She is holding a structured mini leather handbag", nsfw: false },
          { id: "e11", name: "Minimalist Gold Wristwatch", prompt: "She is wearing a slim gold mesh minimalist wristwatch", nsfw: false },
          { id: "e12", name: "Dainty Gold Body Chain", prompt: "She is wearing a fine gold chain tracing across her waist and hips", nsfw: true },
          { id: "e13", name: "Delicate Ankle Bracelet", prompt: "She is wearing a delicate gold anklet", nsfw: false },
          { id: "e14", name: "Leather Biker Gloves", prompt: "She is wearing fingerless black leather moto gloves", nsfw: false },
          { id: "e15", name: "Bold Cocktail Rings", prompt: "She is wearing sculptural gold statement cocktail rings", nsfw: false },
          { id: "e16", name: "90s Oval Dark Sunglasses", prompt: "She is wearing dark tint 90s vintage oval sunglasses", nsfw: false },
          { id: "e17", name: "Lace Thigh Garter", prompt: "She is wearing a delicate scalloped lace garter on one thigh", nsfw: true }
        ]
      }
    ]
  },
  {
    id: "skin",
    name: "Skin & Material Detail",
    type: "flat",
    icon: "Sparkles",
    accent: "#ffa040",
    description: "Photorealistic macro textures, micro-pores, dewy sheen, and natural subsurface scattering",
    els: [
      {
        id: "e0",
        name: "Ultra-Detailed Micro-Pores",
        prompt: "Ultra-detailed skin texture, visible natural micro-pores on nose bridge and cheeks, subsurface scattering, zero airbrushing.",
        nsfw: false
      },
      {
        id: "e1",
        name: "Dewy Glass Skin Glow",
        prompt: "Luminous dewy skin finish, natural glazed sheen on cheekbones, fine hydrated texture, radiant highlights.",
        nsfw: false
      },
      {
        id: "e2",
        name: "Matte Natural Editorial",
        prompt: "Clean matte editorial skin finish, authentic micro-texture, velvet pore structure, commercial magazine retouching.",
        nsfw: false
      },
      {
        id: "e3",
        name: "Sun-Kissed Bronzed Sheen",
        prompt: "Warm sun-kissed bronzed skin tone, golden undertones, realistic warmth, crisp surface highlights.",
        nsfw: false
      },
      {
        id: "e4",
        name: "Fine Natural Freckles",
        prompt: "High-definition natural freckles dusted across cheeks and nose, authentic pigmentation detail, crisp close-up focus.",
        nsfw: false
      },
      {
        id: "e5",
        name: "Post-Workout Moisture Sheen",
        prompt: "Skin glistening with a subtle light workout sweat sheen, realistic specular highlights along collarbone and temples.",
        nsfw: false
      },
      {
        id: "e6",
        name: "Porcelain Translucent",
        prompt: "Porcelain smooth skin with visible delicate veins under natural diffused lighting, soft translucent glow.",
        nsfw: false
      },
      {
        id: "e7",
        name: "Fresh Shower Water Droplets",
        prompt: "Freshly showered skin with micro water droplets beading naturally across bare shoulders, dewy realism.",
        nsfw: false
      },
      {
        id: "e8",
        name: "Cool Weather Rose Flush",
        prompt: "Natural cold-air rosy flush on cheekbones and tip of the nose, fine skin texture, soft winter lighting.",
        nsfw: false
      },
      {
        id: "e9",
        name: "Fine Goosebumps Texture",
        prompt: "Fine goosebump micro-texture raised gently on the arms and neck, evocative realism.",
        nsfw: false
      }
    ]
  },
  {
    id: "comp",
    name: "Composition & Framing",
    type: "tabs",
    icon: "Camera",
    accent: "#4ade80",
    description: "Camera angles, portrait crops, perspective, and visual geometry",
    subcats: [
      {
        id: "angle",
        name: "Camera Angle",
        type: "flat",
        els: [
          { id: "e0", name: "Eye-Level Straight", prompt: "Eye-level shot, camera aligned directly with her eye line for an intimate, grounded perspective.", nsfw: false },
          { id: "e1", name: "High Angle Looking Down", prompt: "High angle shot, camera elevated looking down, creating an elegant flattering perspective.", nsfw: false },
          { id: "e2", name: "Low Angle Empowering", prompt: "Low angle shot, camera positioned low looking up, creating a statuesque, commanding presence.", nsfw: false },
          { id: "e3", name: "Dutch Angle Editorial Tilt", prompt: "Dutch angle framing, subtle camera tilt for kinetic dynamism and fashion editorial flair.", nsfw: false },
          { id: "e4", name: "Overhead Bird's Eye View", prompt: "Directly overhead top-down bird's-eye perspective, geometric aesthetic composition.", nsfw: false },
          { id: "e5", name: "First-Person POV", prompt: "First-person intimate POV perspective, seen directly through the viewer's own eyes.", nsfw: false }
        ]
      },
      {
        id: "framing",
        name: "Shot Framing",
        type: "flat",
        els: [
          { id: "e0", name: "Full-Body Head-to-Toe", prompt: "Full-body composition, her entire figure visible head to toe with balanced floor clearance.", nsfw: false },
          { id: "e1", name: "Half-Body Waist-Up", prompt: "Half-body medium portrait, cleanly framed from the waist up, focal depth on expression.", nsfw: false },
          { id: "e2", name: "Cowboy Shot Mid-Thigh", prompt: "Cowboy shot, framed from mid-thigh up, iconic fashion and Instagram composition.", nsfw: false },
          { id: "e3", name: "Tight Close-Up Headshot", prompt: "Tight close-up portrait, framed around face, collarbone, and hair silhouette.", nsfw: false },
          { id: "e4", name: "Extreme Macro Close-Up", prompt: "Extreme close-up macro framing, focused on eyes, lips, and delicate facial details.", nsfw: false }
        ]
      },
      {
        id: "style",
        name: "Perspective & View",
        type: "flat",
        els: [
          { id: "e0", name: "Mirror Selfie Reflection", prompt: "Casual mirror selfie with smartphone visible in reflection, candid spontaneous aura.", nsfw: false },
          { id: "e1", name: "Candid Mid-Stride Walk", prompt: "Candid walking shot caught mid-stride, natural unposed kinetic energy.", nsfw: false },
          { id: "e2", name: "Over-the-Shoulder Glance", prompt: "Over-the-shoulder perspective, subject glancing back toward camera with alluring intensity.", nsfw: false },
          { id: "e3", name: "Sculptural Side Profile", prompt: "Side profile shot, crisp outline of nose, lips, jawline, and silhouette.", nsfw: false },
          { id: "e4", name: "Rear Back View", prompt: "Shot from behind, showcasing spine curve and outfit back detailing.", nsfw: false },
          { id: "e5", name: "Backlit Silhouette Edge", prompt: "Backlit silhouette framing, contours sharply outlined by bright backlight.", nsfw: false },
          { id: "e6", name: "Through Doorway / Window", prompt: "Framed through doorway or sheer curtains, adding voyeuristic foreground depth.", nsfw: false },
          { id: "e7", name: "Symmetrical Centered", prompt: "Strictly symmetrical centered composition, direct magnetic gaze at lens.", nsfw: false }
        ]
      }
    ]
  },
  {
    id: "pose",
    name: "Pose & Action",
    type: "tabs",
    icon: "Activity",
    accent: "#38bdf8",
    description: "Full body poses, candid motions, seating arrangements, and kinetic gestures",
    subcats: [
      {
        id: "standing",
        name: "Standing",
        type: "flat",
        els: [
          { id: "e0", name: "Standing Tall & Confident", prompt: "Standing tall with shoulders back and confident relaxed posture.", nsfw: false },
          { id: "e1", name: "Leaning Against Wall", prompt: "Standing leaning casually against a textured architectural wall.", nsfw: false },
          { id: "e2", name: "One Leg Forward Stance", prompt: "Standing with one leg extended forward, shifting weight naturally.", nsfw: false },
          { id: "e3", name: "Hand on Hip Glancing Back", prompt: "Standing with hand perched on hip, glancing seductive look over her shoulder.", nsfw: false },
          { id: "e4", name: "Arms Crossed Casual", prompt: "Standing with arms lightly crossed across chest, easy confident smile.", nsfw: false },
          { id: "e5", name: "Leaning Forward into Lens", prompt: "Standing leaning gently forward toward the lens, intimate engaged presence.", nsfw: false },
          { id: "e6", name: "Hands in Denim Pockets", prompt: "Standing with thumbs hooked into denim waistband pockets, effortless swagger.", nsfw: false },
          { id: "e7", name: "Fixing Hair Updo", prompt: "Standing with both arms raised fixing hair, elbows bent in graceful symmetry.", nsfw: false }
        ]
      },
      {
        id: "sitting",
        name: "Sitting",
        type: "flat",
        els: [
          { id: "e0", name: "Sitting Cross-Legged on Bed", prompt: "Sitting comfortably cross-legged on a plush white bed, relaxed posture.", nsfw: false },
          { id: "e1", name: "Sitting on Edge of Chair", prompt: "Sitting poised on the edge of a mid-century modern chair, knees aligned.", nsfw: false },
          { id: "e2", name: "Knees Hugged to Chest", prompt: "Sitting on the floor with knees tucked to chest, arms wrapped around shins.", nsfw: false },
          { id: "e3", name: "Leaning Back on Hands", prompt: "Sitting leaning back on both palms, head tilted upward comfortably.", nsfw: false },
          { id: "e4", name: "Resting Chin on Palm", prompt: "Sitting resting elbow on knee with chin cupped in palm, contemplative gaze.", nsfw: false },
          { id: "e5", name: "Straddling Chair Backward", prompt: "Sitting straddling a chair backward, resting folded arms along the backrest.", nsfw: false }
        ]
      },
      {
        id: "lying",
        name: "Lying Down",
        type: "flat",
        els: [
          { id: "e0", name: "Lying on Back, Hair Fan", prompt: "Lying on her back across white sheets, hair fanning out naturally across the pillow.", nsfw: false },
          { id: "e1", name: "Lying on Stomach on Elbows", prompt: "Lying on her stomach propped up on elbows, feet kicked up playfully behind her.", nsfw: false },
          { id: "e2", name: "Lying on Side Curled", prompt: "Lying gracefully on her side in an S-curve silhouette, gazing at camera.", nsfw: false },
          { id: "e3", name: "Stretched Out Overhead", prompt: "Lying stretched out languidly with arms extending above head, relaxed pose.", nsfw: false }
        ]
      },
      {
        id: "movement",
        name: "Movement & Walk",
        type: "flat",
        els: [
          { id: "e0", name: "Mid-Stride City Walk", prompt: "Caught mid-stride walking through the city, coat hem swaying naturally.", nsfw: false },
          { id: "e1", name: "Playful Turn with Hair Whip", prompt: "Spinning around with playful kinetic motion, hair whipping dynamically in air.", nsfw: false },
          { id: "e2", name: "Walking Away Glancing Back", prompt: "Walking away from camera, head turned glancing back over bare shoulder.", nsfw: false }
        ]
      },
      {
        id: "nsfw",
        name: "Sensual & Boudoir",
        type: "flat",
        els: [
          { id: "e0", name: "Arching Back on Sheets", prompt: "Arching back seductively on the bed, chin tilted up, sultry half-closed eyes.", nsfw: true },
          { id: "e1", name: "Biting Lip Direct Gaze", prompt: "Lightly biting lower lip while looking straight into the lens, tantalizing aura.", nsfw: true },
          { id: "e2", name: "Sliding Strap off Shoulder", prompt: "Slowly sliding one thin shoulder strap downward with fingertips.", nsfw: true },
          { id: "e3", name: "Kneeling on Bed Upright", prompt: "Kneeling upright on a silk duvet, hands resting lightly on hips, commanding gaze.", nsfw: true },
          { id: "e4", name: "Playing with Waistband", prompt: "Playfully tugging at the lace waistband with both thumbs, coy smirk.", nsfw: true },
          { id: "e5", name: "Wrapped in Loose Sheet", prompt: "Loosely wrapped in a single white linen bedsheet, exposing one shoulder and bare leg.", nsfw: true },
          { id: "e6", name: "Fingers Running Through Hair", prompt: "Both hands tangled in hair pulling it back, eyes half-closed in bliss.", nsfw: true },
          { id: "e7", name: "Leaning Forward Seductive", prompt: "Leaning forward propped on palms, accentuating neckline, sultry smile.", nsfw: true }
        ]
      }
    ]
  },
  {
    id: "faceexpr",
    name: "Expression & Mood",
    type: "flat",
    icon: "Smile",
    accent: "#f43f5e",
    description: "Facial expressions, micro-emotions, and gaze intensity",
    els: [
      { id: "e0", name: "Warm Genuine Smile", prompt: "Warm authentic smile with soft crinkles at corners of eyes, inviting warmth.", nsfw: false },
      { id: "e1", name: "Subtle Confident Smirk", prompt: "Subtle wry smirk, one corner of lips raised in knowing confidence.", nsfw: false },
      { id: "e2", name: "Seductive Half-Lidded Gaze", prompt: "Seductive half-lidded bedroom gaze directly penetrating the camera lens.", nsfw: false },
      { id: "e3", name: "Spontaneous Laughter", prompt: "Burst of genuine spontaneous laughter, head tilted back slightly.", nsfw: false },
      { id: "e4", name: "Playful Pout", prompt: "Playful soft pout, plush lips slightly parted, charming expression.", nsfw: false },
      { id: "e5", name: "Biting Lower Lip", prompt: "Teasingly biting lower lip with delicate front teeth, flirtatious look.", nsfw: false },
      { id: "e6", name: "Playful Wink", prompt: "Playful quick wink with bright confident eye sparkle.", nsfw: false },
      { id: "e7", name: "Intense Sultry Stare", prompt: "Intense sultry stare, chin lowered slightly, magnetic unwavering eye contact.", nsfw: false },
      { id: "e8", name: "High-Fashion Neutral", prompt: "Calm high-fashion neutral expression, relaxed parted lips, poised composure.", nsfw: false },
      { id: "e9", name: "Dreamy Contemplative", prompt: "Dreamy wistful gaze drifting off-camera into the middle distance.", nsfw: false },
      { id: "e10", name: "Fierce Cat-Eye Intensity", prompt: "Fierce predator-like focused gaze, sharp arched brows, runway intensity.", nsfw: false },
      { id: "e11", name: "Sleepy Morning Softness", prompt: "Soft sleepy morning expression, relaxed features, tender intimacy.", nsfw: false }
    ]
  },
  {
    id: "env",
    name: "Environment & Setting",
    type: "tabs",
    icon: "MapPin",
    accent: "#a855f7",
    description: "Cinematic locations, atmospheric rooms, outdoor landscapes, and backdrops",
    subcats: [
      {
        id: "indoor",
        name: "Indoor Settings",
        type: "flat",
        els: [
          { id: "e0", name: "Cozy Minimalist Bedroom", prompt: "Setting is a sun-drenched minimalist bedroom, crisp white linens, soft morning shadows.", nsfw: false },
          { id: "e1", name: "Seamless Photo Studio", prompt: "Clean white infinity cove studio background, smooth shadow roll-off.", nsfw: false },
          { id: "e2", name: "Luxury Italian Marble Bath", prompt: "High-end Carrara marble bathroom, freestanding soaking tub, gentle ambient steam.", nsfw: false },
          { id: "e3", name: "SoHo Industrial Loft", prompt: "SoHo loft apartment with exposed brick, 14-foot steel-frame windows, skyline view.", nsfw: false },
          { id: "e4", name: "Mid-Century Living Room", prompt: "Mid-century modern living room with walnut furniture and soft ambient floor lamps.", nsfw: false },
          { id: "e5", name: "Walk-In Vanity Closet", prompt: "Glamour walk-in dressing room with illuminated Hollywood vanity mirror reflections.", nsfw: false },
          { id: "e6", name: "Upscale Penthouse Suite", prompt: "Luxury hotel penthouse with panoramic floor-to-ceiling city night views.", nsfw: false },
          { id: "e7", name: "Artisan Cafe Nook", prompt: "Warm rustic artisan coffee shop corner, raw wood tables, vintage espresso machine in background.", nsfw: false },
          { id: "e8", name: "Atmospheric Cocktail Bar", prompt: "Moody speakeasy lounge with dark mahogany counter and glowing backlit bottles.", nsfw: false },
          { id: "e9", name: "Modern Fitness Gym", prompt: "Architectural modern gym with floor-to-ceiling mirrors and sleek black equipment.", nsfw: false },
          { id: "e10", name: "Artist Loft Atelier", prompt: "Sunlit artist studio with large oil painting canvases and wooden easel.", nsfw: false },
          { id: "e11", name: "Retro Laundromat", prompt: "Neon-lit retro laundromat with rows of circular chrome washing machine doors.", nsfw: false },
          { id: "e12", name: "Mirrored Elevator", prompt: "Sleek brushed brass and mirror interior of a luxury boutique elevator.", nsfw: false }
        ]
      },
      {
        id: "outdoor",
        name: "Outdoor Locations",
        type: "flat",
        els: [
          { id: "e0", name: "Golden Sunlit Beach", prompt: "Golden sunlit Mediterranean beach, soft turquoise waves breaking on powdery sand.", nsfw: false },
          { id: "e1", name: "Neon City Rooftop at Night", prompt: "Urban skyscraper rooftop at night, blurred bokeh of city lights and neon signs.", nsfw: false },
          { id: "e2", name: "Sun-Dappled Pine Forest", prompt: "Sunlit evergreen forest clearing, beams of light filtering through pine needles.", nsfw: false },
          { id: "e3", name: "Luxury Villa Poolside", prompt: "Private luxury villa poolside, shimmering cyan water reflections, tropical palm foliage.", nsfw: false },
          { id: "e4", name: "Alpine Mountain Vista", prompt: "Breathtaking alpine mountain overlook, dramatic misty peaks under pastel sunset.", nsfw: false },
          { id: "e5", name: "Parisian Haussmann Balcony", prompt: "Ornate wrought-iron Parisian balcony overlooking classic zinc roofs at dusk.", nsfw: false },
          { id: "e6", name: "Sahara Desert Dunes", prompt: "Sculpted golden sand dunes stretching endlessly under a vast pristine sky.", nsfw: false },
          { id: "e7", name: "Tuscan Sunset Vineyard", prompt: "Rolling Tuscan vineyard rows bathed in warm amber twilight.", nsfw: false },
          { id: "e8", name: "Lush Botanical Greenhouse", prompt: "Victorian glass greenhouse filled with exotic tropical monstera and ferns.", nsfw: false },
          { id: "e9", name: "Shibuya Rainy Crossing", prompt: "Rain-slicked Shibuya street crossing at dusk, glowing billboard reflections on asphalt.", nsfw: false }
        ]
      }
    ]
  },
  {
    id: "light",
    name: "Lighting Setup",
    type: "flat",
    icon: "Sun",
    accent: "#eab308",
    description: "Natural illumination, studio strobes, chiaroscuro, and colored rim lights",
    els: [
      { id: "e0", name: "Soft North Window Diffused", prompt: "Soft north-facing window light diffusing evenly across the skin, subtle organic falloff.", nsfw: false },
      { id: "e1", name: "Golden Hour Warm Sun", prompt: "Low golden hour sunlight striking from the side, long amber shadows, glowing rim halo.", nsfw: false },
      { id: "e2", name: "Cyber Neon Cyan & Magenta", prompt: "Dual-tone neon lighting with vivid cyan key and hot magenta rim accents.", nsfw: false },
      { id: "e3", name: "Crisp Studio Flash Key", prompt: "High-fashion direct studio flash with beauty dish, crisp sharp shadow edge.", nsfw: false },
      { id: "e4", name: "Warm Intimate Candlelight", prompt: "Low-key intimate candlelight, warm 2200K flickering amber tones, deep velvety shadows.", nsfw: false },
      { id: "e5", name: "Soft Overcast Sky", prompt: "Soft overcast giant diffuser daylight, wrap-around shadowless illumination.", nsfw: false },
      { id: "e6", name: "Dramatic Rembrandt Lighting", prompt: "Classic Rembrandt lighting, distinct luminous triangle highlight on shadow cheek.", nsfw: false },
      { id: "e7", name: "Moody Chiaroscuro Low-Key", prompt: "Moody chiaroscuro lighting, deep cavernous shadow contrast, single directional key.", nsfw: false },
      { id: "e8", name: "Blue Hour Twilight Ambient", prompt: "Cool blue hour natural ambient light, deep sapphire twilight sky, tranquil atmosphere.", nsfw: false },
      { id: "e9", name: "Direct On-Camera Flash", prompt: "Punchy direct on-camera flash, harsh editorial pop, sharp shadow cast immediately behind.", nsfw: false },
      { id: "e10", name: "Volumetric God Rays", prompt: "Volumetric god rays streaming through haze, glowing dust motes, ethereal illumination.", nsfw: false }
    ]
  },
  {
    id: "tech",
    name: "Camera & Optics",
    type: "flat",
    icon: "Aperture",
    accent: "#06b6d4",
    description: "Sensors, lenses, focal lengths, apertures, and analog film stocks",
    els: [
      { id: "e0", name: "Canon EOS R5 · 85mm f/1.2", prompt: "Shot on Canon EOS R5, RF 85mm f/1.2L lens, creamy bokeh, tack-sharp eyelashes.", nsfw: false },
      { id: "e1", name: "Hasselblad X2D · 100MP Medium Format", prompt: "Shot on Hasselblad X2D 100C, 90mm lens, immense dynamic range, micro-tonal graduation.", nsfw: false },
      { id: "e2", name: "Leica M11 · 35mm Summilux", prompt: "Shot on Leica M11 rangefinder, 35mm Summilux f/1.4 ASPH, legendary Leica micro-contrast.", nsfw: false },
      { id: "e3", name: "Kodak Portra 400 · 35mm Analog Grain", prompt: "Shot on Kodak Portra 400 35mm film, authentic analog grain structure, warm skin tones.", nsfw: false },
      { id: "e4", name: "Arri Alexa Mini · Anamorphic 50mm", prompt: "Captured on Arri Alexa Mini, Master Anamorphic 50mm, horizontal lens flare, 2.39:1 scope.", nsfw: false },
      { id: "e5", name: "Sony A7R V · 50mm f/1.2 GM", prompt: "Shot on Sony A7R V, FE 50mm f/1.2 GM lens, razor-sharp wide-open optical fidelity.", nsfw: false },
      { id: "e6", name: "iPhone 16 Pro Raw Max Sensor", prompt: "Captured on iPhone 16 Pro 24mm main sensor, ProRAW capture, natural mobile portrait look.", nsfw: false },
      { id: "e7", name: "100mm Macro Close-Up Lens", prompt: "Shot with 100mm f/2.8 Macro lens, extreme 1:1 magnification on skin and iris detail.", nsfw: false }
    ]
  },
  {
    id: "kw",
    name: "Keywords & Fidelity",
    type: "flat",
    icon: "Sliders",
    accent: "#8b5cf6",
    description: "Quality anchors, render directives, and aesthetic enhancers",
    els: [
      { id: "e0", name: "Masterpiece Magazine Cover", prompt: "Masterpiece, Vogue cover quality, highest aesthetic fidelity.", nsfw: false },
      { id: "e1", name: "Hyper-Realistic Photorealism", prompt: "Hyper-realistic, unretouched natural realism, zero AI artifacts.", nsfw: false },
      { id: "e2", name: "8K UHD Razor-Sharp", prompt: "8K UHD, razor-sharp focus throughout, crystalline micro-detail.", nsfw: false },
      { id: "e3", name: "Award-Winning Portraiture", prompt: "Award-winning portrait photography, National Geographic level realism.", nsfw: false },
      { id: "e4", name: "Cinematic Color Grade", prompt: "Professional color grading, film emulation LUT, balanced dynamic range.", nsfw: false },
      { id: "e5", name: "Physically Based Lighting", prompt: "Physically based raytraced light rendering, authentic bounce and specular behavior.", nsfw: false }
    ]
  }
];

export const INITIAL_DB_STATE: DBState = {
  cats: INITIAL_CATEGORIES,
  selections: {
    style: ["e0"],
    outfit: {
      top: ["e2"],
      bottom: ["e1"]
    },
    comp: {
      framing: ["e1"]
    },
    pose: {
      standing: ["e3"]
    },
    env: {
      indoor: ["e7"]
    },
    light: ["e1"]
  },
  elementWeights: {},
  locks: {},
  nsfwOn: false,
  promptMode: "warped",
  promptEngine: "krea",
  presets: INITIAL_PRESETS,
  activePreset: "p8",
  stylize: 250,
  soundEnabled: true,
  history: []
};
