import { StyleOption } from './types';

export const STYLES: StyleOption[] = [
  {
    id: 1,
    title: "Futuristic Archaeologist",
    description: "Sci-fi gear at a Giza Pyramid with glowing circuits.",
    thumbnail: "/1.png",
    prompt: `
    {
      "reference": "use uploaded image as facial reference, preserve original face and identity exactly",
      "subject_role": "Futuristic Archaeologist Hero",
      "setting": "A vast, futuristic excavation site at the foot of a Giza Pyramid at twilight. The pyramid is partially constructed of glowing digital circuits.",
      "outfit": {
      "style": "Tactical desert sci-fi gear",
      "details": "Worn leather jacket mixed with metallic exoskeleton armor parts, dusty beige scarf, tactical goggles resting on forehead",
      "accessories": "Glowing blue ancient amulet on chest"
      },
      "pose": "Kneeling on one knee, examining a floating holographic artifact artifact with intense curiosity",
      "companion": "A small, rusty but cute spherical robot floating next to the subject's shoulder, scanning the artifact with a red laser beam",
      "atmosphere": {
      "lighting": "Cinematic teal and orange, dramatic backlighting from the sunset and blue glow from the hologram",
      "particles": "Swirling golden sand dust and digital binary codes floating in the air",
      "mood": "Mysterious, epic, discovery"
      },
      "camera": "Low angle, wide lens, shallow depth of field focusing on the subject and the artifact",
      "tech_specs": "8k resolution, hyper-realistic, unreal engine 5 render style, movie poster composition"
    }`
  },
  {
    id: 2,
    title: "3D Vinyl Toy",
    description: "Cute Pixar-style collectible figure.",
    thumbnail: "/2.png",
    prompt: `
    {
      "reference": "use uploaded image as facial reference, preserve original face and identity exactly",
      "character_type": "3D caricature-style collectible figure, cute proportions",
      "pose": "Holding a giant magnifying glass inspecting a tiny golden scarab beetle",
      "head_style": "oversized head with adventurous, excited expression",
      "outfit_head": "classic beige pith helmet (safari hat)",
      "outfit_top": "khaki button-up shirt with rolled sleeves and a brown leather vest",
      "outfit_bottom": "cargo shorts with many pockets",
      "footwear": "chunky brown hiking boots",
      "accessories": "coiled rope on belt, rolled map in backpack",
      "base_detail": "standing on a small patch of desert sand with a mini pyramid tip",
      "lighting": "studio softbox lighting, glossy finish",
      "background": "blurred museum display case",
      "style": "Pixar-style 3D render, vibrant colors, premium vinyl toy texture",
      "texture": "smooth plastic skin, fabric textures on clothes"
    }`
  },
  {
    id: 3,
    title: "Keeper of Time",
    description: "Surreal portrait with hourglass and dissolving sand.",
    thumbnail: "/3.png",
    prompt: `A hyper-realistic surreal portrait of the user (based on uploaded reference) acting as the Keeper of Time inside an ancient Egyptian tomb. The subject is holding a large, ornate antique hourglass.
    Instead of sand, the hourglass is filled with tiny crumbling glowing pyramids falling from the top bulb to the bottom.
    The subject's body is partially turning into swirling sand particles on the right side, blending into the desert wind.
    Outfit: Flowing linen robes mixed with 1920s explorer gear (suspenders, white shirt).
    Expression: Melancholic but wise, staring deeply into the hourglass.
    Background: Dark sandstone walls covered in hieroglyphs that are glowing faintly gold.
    Lighting: Dramatic chiaroscuro, a single beam of light hitting the hourglass and the subject's face.
    Style: Cinematic fantasy realism, detailed particle effects, 8k resolution, masterpiece, mystical atmosphere.`
  },
  {
    id: 4,
    title: "The Map Illusion",
    description: "Optical illusion climbing out of a vintage map.",
    thumbnail: "/4.png",
    prompt: `
    {
      "subject": {
      "description": "A hyper-realistic optical-illusion. The user from the uploaded photo appears to be climbing out of a vintage archaeological map spread on a wooden desk.",
      "reference_image_rules": {
      "preserve_identity": true,
      "expression": "Shocked or excited, looking up at the viewer"
      },
      "pose": {
      "position": "Waist-deep in the map paper, hands pressing on the real desk surface to pull themselves up",
      "effect": "Paper tearing effect around the waist where reality meets the map"
      },
      "clothing": "Vintage 1930s explorer outfit, fedora hat"
      },
      "props": {
      "on_desk": [
      "Brass compass",
      "Antique magnifying glass",
      "Scattered sand grains",
      "A cup of tea"
      ],
      "the_map": {
      "look": "Aged parchment map of the Valley of the Kings, burned edges",
      "details": "X marks the spot in red ink"
      }
      },
      "photography": {
      "shot_type": "Top-down 45-degree angle, macro photography",
      "lighting": "Warm desk lamp lighting, cozy atmosphere",
      "depth_of_field": "Subject face sharp, background desk slightly blurred"
      },
      "negative_prompt": "cartoon, flat 2d, cgi, distortion, bad hands"
    }`
  },
  {
    id: 5,
    title: "Journal Collage",
    description: "Sepia photo on a chaotic investigation board.",
    thumbnail: "/5.png",
    prompt: `
    {
      "variables": {
      "THEME": "Egypt Exploration"
      },
      "image_specs": {
      "aspect_ratio": "4:5", "style": "Scrapbook/Journal Entry", "texture": "Old Paper & Grit"
      },
      "prompt": {
      "master_visual_brief": "A visual diary entry style collage. The background is a texture of aged papyrus and rough canvas. The main subject (user reference) is a photo pinned to the page, but interacting with the drawn elements.",
      "character": "The user is depicted in a sepia-toned photograph style, wearing a safari shirt and wiping sweat from forehead. The photo looks like a developed film print taped onto the journal.",
      "graphic_elements": {
      "puzzle_pieces": "Several jigsaw puzzle pieces are scattered on the page, some fitting together to reveal a map of the Sphinx.",
      "sketches": "Hand-drawn charcoal sketches of Anubis and pyramids surrounding the photo.",
      "objects": "A realistic 3D compass and a fountain pen lying on top of the paper (casting realistic shadows).",
      "text": "Handwritten notes in cursive ink saying 'EUREKA!' and 'Day 45: The tomb is open.'"
      },
      "composition": "Chaotic but artistic investigation board. The user's photo is central. Red strings connect the photo to a sketch of a pyramid.",
      "lighting": "Flat lay photography of a journal, natural sunlight casting shadows from the pen and compass."
      },
      "constraints": {
      "must_include": ["Paper texture", "Tape marks", "Realistic compass", "User identity in sepia tone"],
      "avoid": ["Modern digital graphics", "Neon colors", "Sci-fi elements"]
      }
    }`
  },
  {
    id: 6,
    title: "Tomb Triptych",
    description: "3-panel cinematic story of discovery.",
    thumbnail: "/6.png",
    prompt: `A horizontal triptych collage (3 panels) depicting a narrative of discovery in an Egyptian tomb. Photorealistic cinematic style.
    Left Panel (The Search):
    The subject (user reference) stands in a narrow, dark stone corridor, holding a flaming torch high. Exploring.
    Expression: Focused, squinting into the darkness.
    Lighting: Warm orange glow from the torch against cold blue shadows.
    Outfit: Dusty grey t-shirt, leather gloves.
    Middle Panel (The Puzzle):
    Extreme close-up or over-the-shoulder shot. The subject is blowing dust off a stone wall to reveal a glowing blue hieroglyph puzzle mechanism.
    The subject's hand is reaching out to press a specific stone.
    Focus: Sharp details on the texture of the stone and the dust particles in the air.
    Right Panel (The Treasure):
    The subject stands in a vast, gold-filled chamber, looking upward in awe.
    Background: Massive statues and piles of gold, illuminated by a beam of sunlight from the ceiling.
    Expression: Pure joy and amazement, mouth slightly open.
    Pose: Arms slightly open as if embracing the discovery.
    Technical: Cinematic color grading, 8k, aspect ratio 3:1 (panoramic feel composed of 3 vertical slices), consistent lighting direction across panels.`
  }
];
