/**
 * aiResponses.js
 *
 * Two modes:
 *  1. LIVE  – calls OpenRouter API (set OPENROUTER_API_KEY)
 *  2. LOCAL – keyword-matched fallback (works offline, no key needed)
 *
 * To enable live mode, replace the empty string below with your key:
 *   https://openrouter.ai/keys  (free tier available)
 */

export const OPENROUTER_API_KEY = ''; // ← paste your key here when ready
const OPENROUTER_MODEL = 'mistralai/mistral-7b-instruct:free';

// ─── Keyword → response map (25+ conditions) ─────────────────────────────────
const KNOWLEDGE = [
  {
    keys: ['sore throat', 'throat pain', 'throat ache', 'strep'],
    answer: `For a **sore throat**, try these home remedies:\n\n1. Gargle with warm salt water (½ tsp salt in 1 cup water) 3–4 times a day.\n2. Drink warm honey-lemon tea — honey coats the throat and has antibacterial properties.\n3. Use throat lozenges or hard candy to stimulate saliva.\n4. Stay hydrated; cold water or ice pops can also soothe pain.\n5. Use a cool-mist humidifier in your room overnight.\n\n⚠️ See a doctor if pain is severe, you have a high fever, or symptoms last more than a week.`,
  },
  {
    keys: ['headache', 'head pain', 'migraine', 'tension headache'],
    answer: `For a **headache**, these remedies often help:\n\n1. Rest in a quiet, dark room and close your eyes.\n2. Apply a cold pack to your forehead or a warm compress to the back of your neck.\n3. Take paracetamol or ibuprofen at the first sign of pain.\n4. Drink a large glass of water — dehydration is a common cause.\n5. Gently massage your temples, neck, and shoulders.\n6. Avoid bright screens for a few hours.\n\n⚠️ Seek urgent care for a sudden severe "thunderclap" headache or one with stiff neck and fever.`,
  },
  {
    keys: ['fever', 'high temperature', 'temperature', 'chills'],
    answer: `For a **fever**, here is what to do:\n\n1. Rest and avoid strenuous activity.\n2. Drink plenty of fluids: water, herbal tea, clear broth, diluted juice.\n3. Take paracetamol or ibuprofen to reduce fever and relieve discomfort.\n4. Apply a cool damp cloth to the forehead, armpits, and neck.\n5. Wear light clothing and avoid heavy blankets.\n6. Keep the room at a comfortable temperature.\n\n⚠️ Seek medical care if fever is above 39.5°C, lasts more than 3 days, or is accompanied by stiff neck, rash, or confusion.`,
  },
  {
    keys: ['cold', 'runny nose', 'sneezing', 'blocked nose', 'stuffy nose', 'congestion'],
    answer: `For the **common cold**, home care is usually all you need:\n\n1. Rest and sleep as much as possible.\n2. Drink warm fluids: chicken soup, herbal tea, warm water with honey.\n3. Use saline nasal spray or rinse to clear congestion.\n4. Inhale steam (bowl of hot water, towel over head) for 10 minutes.\n5. Take paracetamol for aches and mild fever.\n6. Elevate your head with an extra pillow at night.\n\nMost colds resolve in 7–10 days. ⚠️ See a doctor if symptoms worsen after day 10 or you develop difficulty breathing.`,
  },
  {
    keys: ['cough', 'dry cough', 'persistent cough', 'whooping'],
    answer: `For a **cough**, these home remedies can help:\n\n1. Take 1–2 teaspoons of honey (not for children under 1 year).\n2. Drink warm liquids: ginger tea, honey-lemon water.\n3. Gargle with salt water to soothe the throat.\n4. Use a cool-mist humidifier to add moisture to the air.\n5. Elevate your head when sleeping.\n6. Avoid smoke, dust, and other irritants.\n\n⚠️ See a doctor if you cough up blood, have a high fever, or the cough lasts more than 3 weeks.`,
  },
  {
    keys: ['stomachache', 'stomach pain', 'abdominal pain', 'belly pain', 'tummy pain'],
    answer: `For **stomach pain**, try these remedies:\n\n1. Rest and avoid solid foods for a few hours; sip clear fluids.\n2. Apply a warm heating pad to your abdomen for 15 minutes.\n3. Drink peppermint or ginger tea to ease cramping.\n4. Once feeling better, eat bland foods: bananas, rice, toast, applesauce (BRAT diet).\n5. Avoid fatty, spicy, or dairy foods until you feel better.\n\n⚠️ Go to A&E if pain is severe and sudden, or if accompanied by vomiting blood, black stools, or rigid abdomen.`,
  },
  {
    keys: ['nausea', 'vomiting', 'sick', 'queasy', 'throwing up'],
    answer: `For **nausea and vomiting**:\n\n1. Sip small amounts of cold, clear liquids (water, ice chips) frequently.\n2. Ginger is effective — try ginger tea, ginger ale, or ginger chews.\n3. Eat small, bland meals when ready: crackers, toast, plain rice.\n4. Rest in a seated or semi-reclined position.\n5. Avoid strong smells, fatty or spicy food.\n6. Over-the-counter anti-nausea medication may help.\n\n⚠️ Seek medical care if vomiting lasts more than 24 hours, if there are signs of dehydration, or if you vomit blood.`,
  },
  {
    keys: ['diarrhoea', 'diarrhea', 'loose stools', 'runny stool'],
    answer: `For **diarrhoea**:\n\n1. Stay hydrated — drink oral rehydration solution (ORS), water, or diluted juice frequently.\n2. Follow the BRAT diet: Bananas, Rice, Applesauce, Toast.\n3. Avoid dairy, caffeine, fatty or high-fibre foods until symptoms resolve.\n4. Rest as much as possible.\n5. Wash hands thoroughly after every toilet visit.\n\n⚠️ See a doctor if diarrhoea lasts more than 2 days, contains blood, or if you show signs of severe dehydration (no urination for 8+ hours, extreme thirst).`,
  },
  {
    keys: ['constipation', 'can\'t poop', 'hard stools', 'no bowel'],
    answer: `For **constipation**:\n\n1. Drink at least 8 glasses of water daily.\n2. Increase dietary fibre: fruits, vegetables, whole grains, legumes.\n3. Exercise daily — even a 20-minute walk stimulates bowel movement.\n4. Try a warm drink first thing in the morning (warm lemon water or coffee).\n5. Don't ignore the urge to go — delaying makes it worse.\n6. Over-the-counter stool softeners can provide short-term relief.\n\n⚠️ See a doctor if constipation lasts more than 3 weeks or is accompanied by blood in stool or weight loss.`,
  },
  {
    keys: ['heartburn', 'acid reflux', 'indigestion', 'gerd', 'burning chest'],
    answer: `For **heartburn and acid reflux**:\n\n1. Eat smaller, more frequent meals instead of large ones.\n2. Don't lie down for 2–3 hours after eating.\n3. Elevate the head of your bed by 15–20cm.\n4. Avoid trigger foods: citrus, tomatoes, chocolate, coffee, alcohol, spicy/fatty food.\n5. Antacids provide quick relief for occasional heartburn.\n6. Lose excess weight if applicable — it significantly reduces reflux.\n\n⚠️ See a doctor if symptoms occur more than twice a week, or if you have difficulty swallowing or unexplained weight loss.`,
  },
  {
    keys: ['back pain', 'lower back', 'backache', 'spine', 'lumbar'],
    answer: `For **back pain**:\n\n1. Apply ice for the first 48 hours (20 min on, 20 min off), then switch to heat.\n2. Take ibuprofen or paracetamol to reduce pain and inflammation.\n3. Stay gently active — complete bed rest is not recommended.\n4. Stretch gently: try the cat-cow stretch and child's pose.\n5. Sleep on your side with a pillow between your knees.\n6. Check your posture when sitting — use a lumbar support cushion.\n\n⚠️ See a doctor if pain radiates down the leg, is accompanied by numbness, or follows an injury.`,
  },
  {
    keys: ['insomnia', 'can\'t sleep', 'sleep problem', 'sleepless', 'trouble sleeping'],
    answer: `For **insomnia**:\n\n1. Keep a consistent sleep schedule — same bedtime and wake time every day.\n2. Avoid screens (phone, TV) for 1 hour before bed; use a blue light filter.\n3. Keep your bedroom cool, dark, and quiet.\n4. Avoid caffeine after 2pm and alcohol within 3 hours of sleep.\n5. Try relaxation techniques: deep breathing, progressive muscle relaxation, or meditation.\n6. Only use your bed for sleep — not work or watching TV.\n\n⚠️ See a doctor if insomnia persists for more than 3 weeks or significantly affects daily functioning.`,
  },
  {
    keys: ['anxiety', 'panic', 'panic attack', 'anxious', 'worry', 'nervous'],
    answer: `For **anxiety**:\n\n1. Try box breathing: inhale 4 sec → hold 4 sec → exhale 4 sec → hold 4 sec. Repeat 4 times.\n2. Ground yourself: name 5 things you see, 4 you hear, 3 you can touch.\n3. Exercise daily — it's one of the most effective anxiety reducers.\n4. Limit caffeine and alcohol, both of which worsen anxiety.\n5. Practice mindfulness meditation for 10 minutes daily.\n6. Talk to someone you trust about what you're feeling.\n\n⚠️ If anxiety is severe, affects daily life, or you have panic attacks frequently, please speak to a mental health professional.`,
  },
  {
    keys: ['acne', 'pimple', 'spot', 'blackhead', 'breakout'],
    answer: `For **acne**:\n\n1. Wash your face gently twice daily with a mild, fragrance-free cleanser.\n2. Use non-comedogenic, oil-free moisturiser and sunscreen.\n3. Apply benzoyl peroxide (2.5–5%) or salicylic acid to affected areas.\n4. Never pick or squeeze spots — this causes scarring and spreads bacteria.\n5. Change pillowcases twice a week.\n6. Drink plenty of water and eat a low-GI diet.\n\n⚠️ See a dermatologist if acne is severe, cystic, or causes significant scarring despite 8 weeks of home treatment.`,
  },
  {
    keys: ['eczema', 'dermatitis', 'itchy skin', 'skin rash', 'dry skin rash'],
    answer: `For **eczema (atopic dermatitis)**:\n\n1. Moisturise immediately after bathing with a thick, fragrance-free cream or ointment.\n2. Take short, lukewarm baths and pat (don't rub) skin dry.\n3. Apply 1% hydrocortisone cream to inflamed areas for up to 7 days.\n4. Use fragrance-free laundry detergent and soaps.\n5. Wear soft, breathable cotton clothing.\n6. Keep nails short to reduce damage from scratching.\n\n⚠️ See a doctor if the rash becomes infected (warm, oozing, crusty) or does not improve after 2–3 weeks.`,
  },
  {
    keys: ['burns', 'burn', 'scald', 'scalding'],
    answer: `For a **minor burn or scald**:\n\n1. Cool immediately under cool (not cold) running water for at least 20 minutes.\n2. Remove jewellery near the burn if possible, before swelling starts.\n3. Cover with a clean, non-fluffy dressing or cling film.\n4. Take paracetamol or ibuprofen for pain.\n5. Do NOT use ice, butter, toothpaste, or any cream on a fresh burn.\n6. Do NOT pop blisters.\n\n⚠️ Go to A&E for burns larger than your hand, burns on the face/hands/groin, all 3rd-degree burns, or chemical/electrical burns.`,
  },
  {
    keys: ['sprain', 'twisted ankle', 'ankle pain', 'wrist sprain'],
    answer: `For a **sprain**:\n\n1. Follow RICE: **R**est, **I**ce (20 min every 2 hours for 48h), **C**ompression (bandage), **E**levation.\n2. Take ibuprofen to reduce pain and swelling.\n3. Avoid putting weight on the injury for 48–72 hours.\n4. After 48 hours, begin gentle range-of-motion exercises.\n5. Use a support bandage or brace when returning to activity.\n\n⚠️ See a doctor if you cannot bear weight, the swelling is severe, or pain does not improve after 3 days (possible fracture).`,
  },
  {
    keys: ['conjunctivitis', 'pink eye', 'red eye', 'eye infection', 'sore eye'],
    answer: `For **conjunctivitis (pink eye)**:\n\n1. Gently clean discharge from eyelids with a warm, damp cotton ball (wipe from inner to outer corner).\n2. Apply a cool or warm compress to closed eyes for relief.\n3. Avoid touching or rubbing your eyes.\n4. Wash hands frequently — conjunctivitis is very contagious.\n5. Remove contact lenses until symptoms clear.\n6. Use lubricating eye drops for comfort.\n\n⚠️ See a doctor if vision is affected, pain is severe, discharge is thick and green/yellow, or a newborn has eye discharge.`,
  },
  {
    keys: ['earache', 'ear pain', 'ear infection', 'blocked ear'],
    answer: `For an **earache**:\n\n1. Hold a warm cloth or heating pad against the affected ear.\n2. Take paracetamol or ibuprofen for pain relief.\n3. Keep the ear dry — place cotton wool in it when showering.\n4. Try chewing gum to relieve pressure-related ear pain.\n5. Sit upright rather than lying flat to help drainage.\n\n⚠️ See a doctor if the pain is severe, there is discharge from the ear, you have a high fever, or hearing is affected. Children with ear pain should always see a doctor.`,
  },
  {
    keys: ['toothache', 'tooth pain', 'dental pain', 'tooth ache'],
    answer: `For a **toothache**:\n\n1. Rinse your mouth with warm salt water.\n2. Take over-the-counter pain relief: ibuprofen is most effective for dental pain.\n3. Apply clove oil to the affected tooth with a cotton ball for natural relief.\n4. Apply a cold pack to the outside of your cheek.\n5. Avoid very hot, cold, or sweet foods that trigger pain.\n\n⚠️ See a dentist as soon as possible — toothache rarely resolves without dental treatment. Go urgently if there is swelling of the face or jaw, or you have a fever.`,
  },
  {
    keys: ['cold sore', 'herpes', 'lip blister', 'mouth blister'],
    answer: `For a **cold sore**:\n\n1. Apply over-the-counter acyclovir cream as soon as you feel tingling — early treatment reduces severity.\n2. Use lip balm with SPF to prevent triggering outbreaks.\n3. Apply a cool or warm damp cloth for comfort.\n4. Avoid touching the sore and wash hands frequently.\n5. Don't share cups, utensils, or lip products while the sore is active.\n\n⚠️ See a doctor if cold sores are very frequent, severe, or occur near the eye.`,
  },
  {
    keys: ['hay fever', 'allergic rhinitis', 'pollen allergy', 'seasonal allergy', 'allergy', 'sneezing allergy'],
    answer: `For **hay fever / allergic rhinitis**:\n\n1. Use saline nasal spray daily to flush out allergens.\n2. Take non-drowsy antihistamines (e.g., loratadine, cetirizine) daily during pollen season.\n3. Keep windows closed on high pollen days; check daily pollen forecasts.\n4. Wear wraparound sunglasses outdoors to protect eyes.\n5. Shower and change clothes after being outdoors.\n6. Apply a small amount of Vaseline inside the nostrils to trap pollen.\n\n⚠️ See a doctor if symptoms are severe, don't respond to antihistamines, or affect your sleep and daily life significantly.`,
  },
  {
    keys: ['asthma', 'wheeze', 'wheezing', 'shortness of breath', 'breathless'],
    answer: `For **asthma management**:\n\n1. Always carry your reliever inhaler (blue/SABA) and use it at first sign of symptoms.\n2. Take your preventer inhaler (brown/ICS) daily as prescribed — do not skip.\n3. Identify and avoid your personal triggers: dust, pollen, exercise in cold air, smoke.\n4. Use a peak flow meter daily if prescribed to monitor your condition.\n5. During a mild attack, sit upright, take 1 puff of reliever, wait 1 minute, repeat up to 10 times.\n\n⚠️ Call 999/112 for a severe attack: if reliever doesn't help after 10 puffs, you can't speak in sentences, or lips turn blue.`,
  },
  {
    keys: ['gout', 'joint pain', 'swollen joint', 'big toe pain'],
    answer: `For **gout** (during a flare):\n\n1. Rest the affected joint and elevate it above heart level.\n2. Apply an ice pack wrapped in cloth for 20 minutes several times a day.\n3. Take ibuprofen or naproxen (NSAIDs) — they are most effective for gout pain.\n4. Stay well hydrated; drink 2–3 litres of water daily.\n5. Avoid alcohol (especially beer), red meat, shellfish, and organ meats during a flare.\n\n⚠️ See a doctor for diagnosis confirmation and preventive medication if you have frequent attacks.`,
  },
  {
    keys: ['urinary tract infection', 'uti', 'burning urination', 'painful urination', 'frequent urination'],
    answer: `For a **urinary tract infection (UTI)**:\n\n1. Drink 2–3 litres of water daily to flush bacteria from the urinary tract.\n2. Urinate frequently — don't hold it in.\n3. Avoid caffeine, alcohol, and citrus juice which irritate the bladder.\n4. Apply a warm heating pad to the lower abdomen for comfort.\n5. Unsweetened cranberry juice or supplements may help prevent recurrence.\n\n⚠️ UTIs usually require antibiotics. See a doctor promptly, especially if you have fever, back pain, or are pregnant. Men with any UTI symptoms should always see a doctor.`,
  },
  {
    keys: ['stress', 'burnout', 'overwhelmed', 'pressure', 'mental health'],
    answer: `For **stress and burnout**:\n\n1. Practice deep breathing: breathe in for 4 counts, hold 4, out for 6. Repeat 5 times.\n2. Exercise for at least 30 minutes daily — it reduces cortisol and boosts mood.\n3. Set boundaries — learn to say no to non-essential commitments.\n4. Prioritise sleep: aim for 7–9 hours per night.\n5. Connect with friends and family — social support is one of the best stress buffers.\n6. Try journaling: write down 3 things you're grateful for each day.\n\n⚠️ If you feel unable to cope, experience burnout for weeks, or have thoughts of self-harm, please speak to a healthcare professional or call a crisis line.`,
  },
];

const GREETING_KEYS = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you'];
const GREETING_RESPONSE = `Hello! 👋 I'm your Home Doctors health assistant.\n\nI can help with home remedies and general health advice for common conditions like:\n\n• Headaches, fever, cold & flu\n• Stomach issues, nausea, heartburn\n• Skin conditions, burns, sprains\n• Ear and eye problems\n• And much more!\n\nJust ask me something like: *"What helps a sore throat?"* or *"How do I treat a sprain?"*\n\n⚠️ I provide general health information only. Always consult a doctor for medical diagnosis or treatment.`;

const DEFAULT_RESPONSE = `I'm sorry, I don't have specific information about that.\n\nHere's what you can try:\n• Search for the condition in the **Home** tab for detailed information.\n• Consult a qualified healthcare provider for personalised advice.\n\nYou can ask me about common conditions like headaches, cold, fever, stomach pain, skin issues, and more!`;

// ─── Local matcher ────────────────────────────────────────────────────────────
export function getLocalResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();

  if (GREETING_KEYS.some((k) => msg.includes(k))) return GREETING_RESPONSE;

  for (const item of KNOWLEDGE) {
    if (item.keys.some((k) => msg.includes(k))) return item.answer;
  }

  return DEFAULT_RESPONSE;
}

// ─── OpenRouter API call ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a helpful home health assistant for the "Home Doctors" app.
You provide clear, practical home remedy advice for common conditions.
Always be concise (max 200 words), use numbered lists where helpful, and always add a disclaimer
to consult a doctor for serious symptoms. Never diagnose. Never prescribe medications.`;

export async function getAIResponse(userMessage, chatHistory = []) {
  if (!OPENROUTER_API_KEY) {
    return getLocalResponse(userMessage);
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://homedoctors.app',
        'X-Title': 'Home Doctors',
      },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages, max_tokens: 300 }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? getLocalResponse(userMessage);
  } catch {
    return getLocalResponse(userMessage);
  }
}
