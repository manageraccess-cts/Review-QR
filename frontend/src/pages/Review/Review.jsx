import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icon";
import {
  getPublicBusiness,
  recordReviewActivity,
} from "../../services/api";
import { useQuestion } from "../../context/QuestionContext";
import "./Review.css";

const getOptionText = (option) =>
  option && typeof option === "object"
    ? String(
      option.text ??
      option.label ??
      option.value ??
      ""
    ).trim()
    : String(option ?? "").trim();

const getOptionScoreByIndex = (
  index,
  total
) => {
  if (total <= 1) return 3;

  if (total === 2) {
    return index === 0 ? 5 : 1;
  }

  if (total === 3) {
    return [5, 3, 1][index] ?? 3;
  }

  if (total === 4) {
    return [5, 4, 2, 1][index] ?? 3;
  }

  if (total === 5) {
    return [5, 4, 3, 2, 1][index] ?? 3;
  }

  return Math.round(
    5 - (index / (total - 1)) * 4
  );
};

const getAnswerTypeByScore = (score) =>
  score >= 4
    ? "positive"
    : score <= 2
      ? "negative"
      : "neutral";

const getOptionEmoji = (
  index,
  total
) => {
  if (total === 2) {
    return index === 0 ? "🤩" : "😞";
  }

  if (total === 3) {
    return ["🤩", "😐", "😞"][index] || "😐";
  }

  if (total === 4) {
    return (
      ["🤩", "😊", "😐", "😞"][index] ||
      "😐"
    );
  }

  if (total === 5) {
    return (
      ["🤩", "😊", "😐", "😕", "😣"][
      index
      ] || "😐"
    );
  }

  return index === 0
    ? "🤩"
    : index === total - 1
      ? "😞"
      : "😊";
};

const getQuestionTopic = (question) => {
  if (!question) return "overall";

  const text = String(
    question.question || ""
  )
    .toLowerCase()
    .replace(/[?؟]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (
    /recommend|suggest.*others|refer.*others/.test(
      text
    )
  ) {
    return "recommendation";
  }

  if (
    /parking|park.*vehicle|vehicle.*park/.test(
      text
    )
  ) {
    return "parking";
  }

  if (
    /bill|billing|invoice|payment|checkout|receipt|charge/.test(
      text
    )
  ) {
    return "billing";
  }

  if (
    /booking|book\b|reservation|reserve\b|appointment|registration|check.?in|check.?out|schedule|scheduling/.test(
      text
    )
  ) {
    return "booking";
  }

  if (
    /delivery|delivered|shipping|dispatch|arrival|arrived|courier/.test(
      text
    )
  ) {
    return "delivery";
  }

  const professionalMatch =
    text.match(
      /\b(dermatologist|doctor|physician|specialist|dentist|therapist|surgeon|nurse|practitioner|clinician|consultant)\b/i
    );

  if (
    professionalMatch &&
    /listen|listened|listening|understand|understood|understanding|concern|concerns|attention|paid attention/.test(
      text
    )
  ) {
    return "doctor_attention";
  }

  if (professionalMatch) {
    return "doctor";
  }

  if (
    /reception|front desk|welcome|welcoming|host|hostess/.test(
      text
    )
  ) {
    return "reception";
  }

  if (
    /staff|employee|team|waiter|waitress|manager|helpful|friendly|professional|hospitality|behaviour|behavior|courteous|polite/.test(
      text
    )
  ) {
    return "staff";
  }

  if (
    /clean|cleanliness|hygiene|sanit|tidy|neat|washroom|restroom|bathroom|toilet|maintenance|maintained|upkeep/.test(
      text
    )
  ) {
    return "cleanliness";
  }

  if (
    /ambience|atmosphere|environment|music|decor|decoration|interior|vibe|surrounding/.test(
      text
    )
  ) {
    return "ambience";
  }

  if (
    /comfort|comfortable|bed|mattress|sleep|seating|seat|relax|relaxing/.test(
      text
    )
  ) {
    return "comfort";
  }

  if (
    /safe|safety|secure|security|guard|protection|privacy/.test(
      text
    )
  ) {
    return "safety";
  }

  if (
    /price|pricing|value|cost|money|afford|worth|expensive|budget/.test(
      text
    )
  ) {
    return "value";
  }

  if (
    /fast|speed|quick|wait|waiting|time|timely|delay|turnaround|prompt/.test(
      text
    )
  ) {
    return "speed";
  }

  if (
    /communication|communicate|clear|information|response|responsive|contact|message|update|explained|explanation|clarity/.test(
      text
    )
  ) {
    return "communication";
  }

  if (
    /food|dish|taste|tasty|flavour|flavor|season|meal|cuisine|dessert|drink|beverage|portion|menu/.test(
      text
    )
  ) {
    return "food";
  }

  if (
    /room|stay|accommodation|hostel|pg|lodge|hotel|housekeeping/.test(
      text
    )
  ) {
    return "room";
  }

  if (
    /location|located|access|accessible|near|distance|reach|connectivity|transport/.test(
      text
    )
  ) {
    return "location";
  }

  if (
    /facility|facilities|amenity|amenities|equipment|wifi|wi.?fi|internet|lift|elevator|gym|pool|workspace/.test(
      text
    )
  ) {
    return "facilities";
  }

  if (
    /quality|product|item|material|result|work|performance|durability|finish|craftsmanship|treatment/.test(
      text
    )
  ) {
    return "quality";
  }

  if (
    /service|serving|assistance|customer care|customer support|support/.test(
      text
    )
  ) {
    return "service";
  }

  return "overall";
};

const QUESTION_LABELS = {
  booking: [
    [
      "Very easy to arrange",
      "Quite simple to book",
      "It was okay",
      "A little difficult",
      "Very difficult to arrange",
    ],
    [
      "Smooth and easy",
      "Pretty straightforward",
      "Worked out fine",
      "Took some effort",
      "More difficult than expected",
    ],
    [
      "Quick and effortless",
      "Easy enough",
      "Fairly average",
      "Could be smoother",
      "Quite frustrating",
    ],
  ],

  reception: [
    [
      "Very welcoming",
      "Friendly and warm",
      "Pleasant enough",
      "Could be warmer",
      "Not very welcoming",
    ],
    [
      "Made me feel at home",
      "Polite and approachable",
      "Fine overall",
      "A little distant",
      "Rather unwelcoming",
    ],
    [
      "Warm from the start",
      "Courteous and friendly",
      "Nothing special",
      "Could be more attentive",
      "Felt quite impersonal",
    ],
  ],

  doctor_attention: [
    [
      "Listened very carefully",
      "Took time to understand me",
      "Addressed the main points",
      "Could have listened more",
      "Felt rather rushed",
    ],
    [
      "Really heard my concerns",
      "Patient and understanding",
      "Covered what mattered",
      "Needed more discussion",
      "Did not feel fully heard",
    ],
    [
      "Gave me plenty of attention",
      "Listened with patience",
      "Handled my concerns adequately",
      "Could have been more thorough",
      "Barely had time to listen",
    ],
  ],

  doctor: [
    [
      "Highly professional",
      "Knowledgeable and reassuring",
      "Good overall",
      "Could be more attentive",
      "Less thorough than expected",
    ],
    [
      "Excellent consultation",
      "Calm and professional",
      "Quite satisfactory",
      "Needed more detail",
      "Not as reassuring as hoped",
    ],
    [
      "Extremely competent",
      "Friendly and knowledgeable",
      "Handled things reasonably well",
      "Could have explained more",
      "Left me with concerns",
    ],
  ],

  staff: [
    [
      "Very helpful",
      "Friendly and polite",
      "Helpful enough",
      "Could be more attentive",
      "Not very helpful",
    ],
    [
      "Genuinely caring",
      "Pleasant to deal with",
      "Fine for the most part",
      "A little inattentive",
      "Quite unhelpful",
    ],
    [
      "Went out of their way to help",
      "Courteous and cooperative",
      "Reasonably supportive",
      "Needed more involvement",
      "Felt disengaged",
    ],
  ],

  service: [
    [
      "Excellent service",
      "Smooth and attentive",
      "Good enough",
      "Could be more responsive",
      "Below my expectations",
    ],
    [
      "Really well handled",
      "Efficient and friendly",
      "Fairly decent",
      "A little inconsistent",
      "Quite disappointing",
    ],
    [
      "Top-notch service",
      "Professional and prompt",
      "Nothing exceptional",
      "Needs more attention",
      "Not handled very well",
    ],
  ],

  cleanliness: [
    [
      "Spotlessly clean",
      "Neat and well kept",
      "Clean enough",
      "Could be cleaner",
      "Needs serious attention",
    ],
    [
      "Immaculately maintained",
      "Fresh and tidy",
      "Acceptable overall",
      "Some areas were overlooked",
      "Not as clean as expected",
    ],
    [
      "Exceptionally hygienic",
      "Well maintained",
      "Reasonably clean",
      "Upkeep could improve",
      "Poorly maintained",
    ],
  ],

  ambience: [
    [
      "Lovely atmosphere",
      "Calm and pleasant",
      "Comfortable enough",
      "A little dull",
      "Not very inviting",
    ],
    [
      "Warm and relaxing",
      "Pleasant surroundings",
      "Fine for a short visit",
      "Could feel more welcoming",
      "Rather uncomfortable",
    ],
    [
      "Beautiful setting",
      "Peaceful and inviting",
      "Nothing particularly stood out",
      "A bit lacking in atmosphere",
      "Quite uninviting",
    ],
  ],

  comfort: [
    [
      "Extremely comfortable",
      "Easy to relax",
      "Comfortable enough",
      "A little uncomfortable",
      "Difficult to relax",
    ],
    [
      "Very relaxing",
      "Pleasant and comfortable",
      "Fine for the visit",
      "Could be more comfortable",
      "Quite uncomfortable",
    ],
    [
      "Really comfortable",
      "Easygoing and relaxed",
      "Reasonably comfortable",
      "Needed better comfort",
      "Hard to settle in",
    ],
  ],

  safety: [
    [
      "Felt completely safe",
      "Good sense of security",
      "Secure enough",
      "Had a few concerns",
      "Did not feel safe",
    ],
    [
      "Very reassuring",
      "Well secured",
      "Adequate overall",
      "Could feel more secure",
      "Security felt lacking",
    ],
    [
      "Very safe and secure",
      "Comfortable with the arrangements",
      "No major concerns",
      "Some room for improvement",
      "Left me uneasy",
    ],
  ],

  value: [
    [
      "Excellent value",
      "Worth what I paid",
      "Fair for the price",
      "A little expensive",
      "Not worth the cost",
    ],
    [
      "Great value for money",
      "Reasonably priced",
      "About what I expected",
      "Could offer more for the price",
      "Too costly for what I received",
    ],
    [
      "Very good for the price",
      "Good value",
      "Acceptable value",
      "Slightly overpriced",
      "Poor value overall",
    ],
  ],

  speed: [
    [
      "Very quick",
      "Prompt and smooth",
      "Reasonable timing",
      "Took longer than expected",
      "Far too slow",
    ],
    [
      "Almost no waiting",
      "Moved along quickly",
      "Wait was manageable",
      "A bit delayed",
      "Unnecessarily slow",
    ],
    [
      "Super efficient",
      "Handled promptly",
      "Average turnaround",
      "Could move faster",
      "Significant delay",
    ],
  ],

  communication: [
    [
      "Very clear",
      "Easy to understand",
      "Clear enough",
      "Could be explained better",
      "Quite confusing",
    ],
    [
      "Excellent communication",
      "Kept me well informed",
      "Got the basic information",
      "Some details were unclear",
      "Poorly communicated",
    ],
    [
      "Everything was explained clearly",
      "Easy to communicate with",
      "Information was adequate",
      "Needed more clarity",
      "Left me with questions",
    ],
  ],

  food: [
    [
      "Delicious and fresh",
      "Tasty and well prepared",
      "Decent meal",
      "Could use more flavor",
      "Not enjoyable",
    ],
    [
      "Loved the taste",
      "Nicely prepared",
      "Quite average",
      "A little bland",
      "Did not suit my taste",
    ],
    [
      "Really flavorful",
      "Fresh and enjoyable",
      "Good enough",
      "Needs better seasoning",
      "Below my expectations",
    ],
  ],

  room: [
    [
      "Beautiful and comfortable",
      "Clean and well maintained",
      "Decent overall",
      "Needs some attention",
      "Poorly maintained",
    ],
    [
      "Very inviting",
      "Comfortable and tidy",
      "Adequate for the stay",
      "Could be better kept",
      "Not comfortable enough",
    ],
    [
      "Excellent condition",
      "Pleasant and clean",
      "Fine for a short stay",
      "A few things need fixing",
      "Below expectations",
    ],
  ],

  location: [
    [
      "Very convenient",
      "Easy to reach",
      "Manageable location",
      "A little inconvenient",
      "Difficult to access",
    ],
    [
      "Perfectly located",
      "Convenient and accessible",
      "Decent location",
      "Not the easiest location",
      "Quite inconvenient",
    ],
    [
      "Great location",
      "Easy to access",
      "Decent location",
      "Not the easiest location",
      "Quite inconvenient",
    ],
  ],

  facilities: [
    [
      "Everything I needed",
      "Very well equipped",
      "Adequate facilities",
      "Could use a few additions",
      "Insufficient facilities",
    ],
    [
      "Excellent amenities",
      "Good range of facilities",
      "Fine for the basics",
      "Some facilities were missing",
      "Needs better facilities",
    ],
    [
      "Really well equipped",
      "Useful amenities",
      "Reasonable facilities",
      "Could offer more",
      "Quite limited",
    ],
  ],

  quality: [
    [
      "Exceptional quality",
      "Very good standard",
      "Good enough",
      "Below expectations",
      "Poor quality",
    ],
    [
      "Premium quality",
      "High standard",
      "Acceptable quality",
      "Could be improved",
      "Low quality",
    ],
    [
      "Impressive quality",
      "Well done",
      "Reasonable standard",
      "A few shortcomings",
      "Not up to the mark",
    ],
  ],

  delivery: [
    [
      "Arrived perfectly on time",
      "Delivered smoothly",
      "Arrived as expected",
      "Slightly delayed",
      "Far too late",
    ],
    [
      "Quick and reliable",
      "Prompt delivery",
      "Reasonable timing",
      "Took longer than expected",
      "Very delayed",
    ],
    [
      "Handled really well",
      "Delivered without trouble",
      "Fine overall",
      "Could be faster",
      "Poor delivery experience",
    ],
  ],

  billing: [
    [
      "Very clear and simple",
      "Easy to understand",
      "Straightforward enough",
      "A little confusing",
      "Very confusing",
    ],
    [
      "Quick and transparent",
      "Clear payment process",
      "Fine overall",
      "Needed more explanation",
      "Poorly explained",
    ],
    [
      "Simple checkout",
      "Smooth payment",
      "Acceptable process",
      "Some confusion",
      "Difficult to follow",
    ],
  ],

  parking: [
    [
      "Very convenient",
      "Easy to find a spot",
      "Manageable",
      "A little difficult",
      "Very difficult",
    ],
    [
      "Plenty of parking",
      "Parking was convenient",
      "Found a spot eventually",
      "Limited availability",
      "Parking was a problem",
    ],
    [
      "Easy parking",
      "Reasonably convenient",
      "Fine overall",
      "Could have more space",
      "Very inconvenient",
    ],
  ],

  recommendation: [
    [
      "Would definitely recommend",
      "Would gladly recommend",
      "Probably would",
      "Not sure yet",
      "Would not recommend",
    ],
    [
      "Absolutely worth recommending",
      "Happy to suggest it",
      "Worth considering",
      "I have some reservations",
      "I would look elsewhere",
    ],
    [
      "Would recommend without hesitation",
      "Likely to recommend",
      "Could recommend",
      "Might think twice",
      "Would not suggest it",
    ],
  ],

  overall: [
    [
      "Excellent overall",
      "Really positive",
      "Fine overall",
      "Could be better",
      "Disappointing",
    ],
    [
      "A great experience",
      "Quite a good experience",
      "Average overall",
      "Some room for improvement",
      "Not a good experience",
    ],
    [
      "Outstanding",
      "Pleasant overall",
      "Reasonable",
      "Below expectations",
      "Poor overall",
    ],
  ],
};

const getQuestionCategory = (
  question
) => {
  const topic =
    getQuestionTopic(question);

  return QUESTION_LABELS[topic]
    ? topic
    : "service";
};

const getProfessionalOptionLabels = (
  question,
  total
) => {
  const sets =
    QUESTION_LABELS[
    getQuestionCategory(question)
    ] ||
    QUESTION_LABELS.service;

  const seed =
    `${question?.id || ""}-${question?.question || ""}`;

  const labels =
    sets[
    Math.abs(
      seed
        .split("")
        .reduce(
          (sum, char) =>
            sum +
            char.charCodeAt(0),
          0
        )
    ) % sets.length
    ];

  if (total === 2) {
    return [
      labels[0],
      labels[4],
    ];
  }

  if (total === 3) {
    return [
      labels[0],
      labels[2],
      labels[4],
    ];
  }

  if (total === 4) {
    return [
      labels[0],
      labels[1],
      labels[3],
      labels[4],
    ];
  }

  if (total === 5) {
    return labels.slice(0, 5);
  }

  return Array.from(
    { length: total },
    (_, index) => {
      if (index === 0)
        return labels[0];

      if (
        index ===
        total - 1
      )
        return labels[4];

      return (
        labels[index] ||
        labels[2]
      );
    }
  );
};

const LIBRARY = {
  booking: {
    positive: [
      "Booking the appointment was straightforward and hassle-free.",
      "Setting up the appointment was quick and easy.",
      "I could arrange the appointment without any trouble.",
    ],
    neutral: [
      "Booking was reasonably straightforward for my visit.",
      "The appointment arrangement was fine, although it could be smoother.",
      "Scheduling worked out without any major issue.",
    ],
    negative: [
      "Scheduling the appointment was more difficult than it needed to be.",
      "The booking process involved unnecessary delays.",
      "Arranging the appointment was frustrating and less smooth than expected.",
    ],
  },

  reception: {
    positive: [
      "The reception team greeted me warmly and made me feel comfortable.",
      "I received a friendly welcome and the front desk handled things smoothly.",
      "The warm welcome at reception set a positive tone for my visit.",
    ],
    neutral: [
      "The reception team was polite and reasonably helpful.",
      "The welcome was pleasant enough, although it felt routine.",
      "The front desk handled things adequately.",
    ],
    negative: [
      "The welcome at reception felt rather impersonal.",
      "The reception team could have been more attentive and welcoming.",
      "The front desk interaction was less helpful than I expected.",
    ],
  },

  doctor_attention: {
    positive: [
      "The doctor listened carefully to my concerns and made sure I felt heard.",
      "I appreciated how patiently the doctor listened and addressed my concerns.",
      "The consultation felt personal because the doctor took time to understand me.",
    ],
    neutral: [
      "The doctor listened to my concerns, although the consultation felt brief.",
      "My concerns were addressed reasonably well, but I would have appreciated more discussion.",
      "The consultation covered the main points, though it could have felt more personal.",
    ],
    negative: [
      "I felt the doctor could have spent more time listening to my concerns.",
      "The consultation felt rushed and I did not feel fully heard.",
      "I would have appreciated a more thorough discussion of my concerns.",
    ],
  },

  doctor: {
    positive: [
      "The doctor was professional, attentive, and reassuring.",
      "I felt I was in capable hands during the consultation.",
      "The consultation was handled professionally and I felt comfortable discussing my concerns.",
    ],
    neutral: [
      "The consultation was satisfactory, although fairly straightforward.",
      "The doctor handled the consultation well enough, with a few areas that could be stronger.",
      "The care was reasonable, although I expected a little more detail.",
    ],
    negative: [
      "The consultation felt rushed and could have been more thorough.",
      "I expected a more detailed and attentive consultation.",
      "The level of care did not quite match what I had hoped for.",
    ],
  },

  staff: {
    positive: [
      "The staff were courteous and helpful whenever I needed assistance.",
      "Everyone I interacted with was friendly and approachable.",
      "The team was pleasant to deal with and handled things professionally.",
    ],
    neutral: [
      "The staff were polite and handled my requests adequately.",
      "Everyone was reasonably helpful, although the interaction felt routine.",
      "The team was fine, with some room for a more attentive approach.",
    ],
    negative: [
      "The staff could have been more attentive and responsive.",
      "Some interactions were less helpful than they should have been.",
      "The team seemed a little disengaged during my visit.",
    ],
  },

  service: {
    positive: [
      "The service was thoughtful, efficient, and professional.",
      "Everything was handled smoothly and with good attention to detail.",
      "The service felt organized and customer friendly.",
    ],
    neutral: [
      "The service was acceptable, although it could have felt more attentive.",
      "Things were handled reasonably well, but there was room for a smoother process.",
      "The service was fine, although nothing particularly stood out.",
    ],
    negative: [
      "The service felt inconsistent and could have been more attentive.",
      "I expected a more organized and customer-focused approach.",
      "The service fell short of what I had expected.",
    ],
  },

  cleanliness: {
    positive: [
      "The place was clean, tidy, and well maintained.",
      "Everything looked neat and hygienic, which made me feel comfortable.",
      "The surroundings were fresh and well kept.",
    ],
    neutral: [
      "The place was reasonably clean, although a few areas could have been better maintained.",
      "The surroundings were acceptable, but there was room for more attention to cleanliness.",
      "The basic cleanliness was fine for my visit.",
    ],
    negative: [
      "The place could have been cleaner and better maintained.",
      "A few areas needed more attention to hygiene and upkeep.",
      "The level of cleanliness was below what I expected.",
    ],
  },

  ambience: {
    positive: [
      "The atmosphere was calm, pleasant, and inviting.",
      "The setting made the visit more comfortable.",
      "I liked the peaceful atmosphere.",
    ],
    neutral: [
      "The atmosphere was pleasant enough, although nothing particularly stood out.",
      "The setting was comfortable, but it could have felt more inviting.",
      "The atmosphere was fine for a short visit.",
    ],
    negative: [
      "The atmosphere felt less welcoming than I expected.",
      "The setting could use some improvement to feel more comfortable.",
      "The surroundings could have been more inviting.",
    ],
  },

  comfort: {
    positive: [
      "The setting was comfortable and made it easy to relax.",
      "I felt at ease throughout the visit.",
      "The waiting area was comfortable and thoughtfully arranged.",
    ],
    neutral: [
      "The place was reasonably comfortable for the duration of my visit.",
      "I was comfortable enough, although there is room to improve the setting.",
      "The comfort level was adequate for the visit.",
    ],
    negative: [
      "The setting was not as comfortable as I expected.",
      "I found it difficult to relax during the visit.",
      "A more comfortable setup would have helped.",
    ],
  },

  safety: {
    positive: [
      "I felt safe and comfortable throughout my visit.",
      "The place gave me a good sense of safety and professionalism.",
      "The environment felt secure and well managed.",
    ],
    neutral: [
      "I felt reasonably comfortable with the overall arrangements.",
      "The environment seemed secure enough, although there is room for improvement.",
      "The arrangements seemed adequate for the visit.",
    ],
    negative: [
      "I did not feel completely comfortable with the arrangements.",
      "The environment could have provided a stronger sense of security.",
      "A stronger sense of security would have made me more comfortable.",
    ],
  },

  value: {
    positive: [
      "The service felt well worth the price.",
      "Considering the quality of care, the cost seemed reasonable.",
      "The experience offered good value for what I paid.",
    ],
    neutral: [
      "The pricing seemed reasonable, although I expected slightly more for the cost.",
      "The experience was fairly priced, but the value could be stronger.",
      "The cost was acceptable for the visit.",
    ],
    negative: [
      "The price felt high for the level of service I received.",
      "I did not feel the experience offered enough value for the cost.",
      "I would have expected more for the amount paid.",
    ],
  },

  speed: {
    positive: [
      "Everything moved along efficiently without making me feel rushed.",
      "The process was handled promptly without unnecessary waiting.",
      "Things were well organized, so the visit moved along smoothly.",
    ],
    neutral: [
      "The process took a reasonable amount of time, although it was not especially quick.",
      "The waiting time was manageable, but the process could have moved faster.",
      "The timing was acceptable for the visit.",
    ],
    negative: [
      "The process took longer than expected and could have been organized better.",
      "The waiting time was frustrating and things moved slowly.",
      "A faster process would have made the visit easier.",
    ],
  },

  communication: {
    positive: [
      "The explanations were clear and easy to understand.",
      "I appreciated how clearly everything was explained to me.",
      "Communication was straightforward and I always knew what was happening.",
    ],
    neutral: [
      "The main information was explained clearly, although a few details could have been clearer.",
      "Communication was adequate, but there was room for better clarity.",
      "The main points were clear enough for me.",
    ],
    negative: [
      "Some explanations were unclear and left me with questions.",
      "Communication could have been more direct and informative.",
      "I would have appreciated clearer guidance.",
    ],
  },

  food: {
    positive: [
      "The food was flavorful and nicely prepared.",
      "I enjoyed the taste and presentation of the food.",
      "The meal was fresh, well seasoned, and enjoyable.",
    ],
    neutral: [
      "The food was decent, although more attention to flavor would help.",
      "The meal was satisfactory, but it did not particularly stand out.",
      "The food was fine for what I ordered.",
    ],
    negative: [
      "The food did not meet my expectations in taste and preparation.",
      "The meal could have been fresher and more flavorful.",
      "More attention to freshness and seasoning would have helped.",
    ],
  },

  room: {
    positive: [
      "The room was clean, comfortable, and pleasant to stay in.",
      "I liked how well the room was maintained and arranged.",
      "The accommodation felt comfortable and thoughtfully looked after.",
    ],
    neutral: [
      "The room was comfortable enough, although a few details could be improved.",
      "The accommodation was acceptable, with some scope for better upkeep.",
      "The room covered the basics for the stay.",
    ],
    negative: [
      "The room needed better upkeep and was not as comfortable as expected.",
      "The accommodation fell short in comfort and maintenance.",
      "Better upkeep would have made the space more comfortable.",
    ],
  },

  location: {
    positive: [
      "The location was convenient and easy to reach.",
      "Getting to the place was simple and the location worked well for me.",
      "The convenient location made the visit easier.",
    ],
    neutral: [
      "The location was reasonably convenient for me.",
      "The place was accessible enough, although it could be more convenient.",
      "Getting there was manageable for this visit.",
    ],
    negative: [
      "The location was less convenient than I expected.",
      "Getting there was more difficult than it should have been.",
      "Easier access would have made the visit more convenient.",
    ],
  },

  facilities: {
    positive: [
      "The facilities were well maintained and had what I needed.",
      "I was impressed by how well equipped the place was.",
      "The available facilities added to the convenience of the visit.",
    ],
    neutral: [
      "The facilities covered the basics, although a few additions would have been useful.",
      "The available amenities were adequate, but there is room for improvement.",
      "The facilities were fine for what I needed.",
    ],
    negative: [
      "The available facilities were limited and could have been better maintained.",
      "A few important amenities were missing, making the visit less convenient.",
      "Better-equipped facilities would have improved the visit.",
    ],
  },

  quality: {
    positive: [
      "The quality was impressive and met my expectations.",
      "I was pleased with the standard of service I received.",
      "The attention to detail reflected a high standard.",
    ],
    neutral: [
      "The quality was acceptable, although it did not stand out.",
      "The standard was reasonable, with a few areas that could be improved.",
      "The quality met the basic expectations of the visit.",
    ],
    negative: [
      "The quality fell short of my expectations.",
      "I expected a higher standard of care and attention to detail.",
      "Greater consistency in quality would have made a difference.",
    ],
  },

  delivery: {
    positive: [
      "The delivery arrived on time and was handled carefully.",
      "Everything was delivered smoothly without unnecessary delays.",
      "My order arrived as expected and in good condition.",
    ],
    neutral: [
      "The delivery arrived as expected, although the process was fairly ordinary.",
      "The order reached me without major issues, but there was room for a smoother process.",
      "The delivery was acceptable for what I needed.",
    ],
    negative: [
      "The delivery took longer than expected and could have been handled more carefully.",
      "There were delays with the delivery that made the experience frustrating.",
      "Better coordination could make the delivery more reliable.",
    ],
  },

  billing: {
    positive: [
      "The billing process was clear and straightforward.",
      "Payment was quick and there were no confusing charges.",
      "The final bill was easy to understand and checkout was smooth.",
    ],
    neutral: [
      "The billing process was straightforward enough, although more clarity would help.",
      "Payment was handled without major issues, but the process could be more streamlined.",
      "The payment was fine for the visit.",
    ],
    negative: [
      "The billing process was confusing and took longer than necessary.",
      "The payment and billing details could have been explained more clearly.",
      "A simpler payment flow would have made checkout easier.",
    ],
  },

  parking: {
    positive: [
      "Finding parking was convenient and made the visit easier.",
      "The parking arrangements were quite convenient.",
      "I had no trouble finding a suitable place to park.",
    ],
    neutral: [
      "Parking was manageable, although it was not especially convenient.",
      "I was able to park, but the arrangements could be improved.",
      "The parking setup was workable for my visit.",
    ],
    negative: [
      "Parking was difficult to manage and added unnecessary inconvenience.",
      "The parking arrangements were limited and could be improved.",
      "Finding a spot could have been much easier.",
    ],
  },

  recommendation: {
    positive: [
      "I would happily recommend this place to others.",
      "I would have no hesitation in recommending it.",
      "I can see myself suggesting this place to friends and family.",
    ],
    neutral: [
      "I could recommend the place, although there are areas that could be improved.",
      "I would consider recommending it depending on what someone is looking for.",
      "A few improvements would make recommending it easier.",
    ],
    negative: [
      "I would probably look at other options before recommending this place.",
      "Based on my visit, I would hesitate to recommend it.",
      "I would want to see some improvements before recommending it.",
    ],
  },

  overall: {
    positive: [
      "I came away with a very positive impression of the visit.",
      "The visit was pleasant from beginning to end.",
      "My time there was genuinely enjoyable.",
    ],
    neutral: [
      "The visit was fairly average.",
      "The visit was okay, although a few aspects could be improved.",
      "There were both good and average aspects to the visit.",
    ],
    negative: [
      "The visit did not meet my expectations.",
      "The visit left me disappointed.",
      "I expected a better experience.",
    ],
  },
};

const Review = () => {
  const { questions } = useQuestion();

  const [business, setBusiness] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [started, setStarted] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [generatedReview, setGeneratedReview] =
    useState("");

  const [reviewGenerated, setReviewGenerated] =
    useState(false);

  const [showCopyPopup, setShowCopyPopup] =
    useState(false);

  const [generationNumber, setGenerationNumber] =
    useState(0);

  const businessId = useMemo(() => {
    const parts =
      window.location.pathname
        .split("/")
        .filter(Boolean);

    if (
      parts.length >= 2 &&
      parts[0].toLowerCase() === "r"
    ) {
      return parts[1];
    }

    return null;
  }, []);

  useEffect(() => {
    const loadBusiness =
      async () => {
        if (!businessId) {
          setError(
            "Invalid review link."
          );
          setLoading(false);
          return;
        }

        try {
          const response =
            await getPublicBusiness(
              businessId
            );

          if (
            !response?.success ||
            !response.data
          ) {
            throw new Error(
              "Business not found."
            );
          }

          setBusiness(
            response.data
          );
        } catch (err) {
          console.error(
            "Failed to load business:",
            err
          );

          setError(
            err.message ||
            "Unable to load this review page."
          );
        } finally {
          setLoading(false);
        }
      };

    loadBusiness();
  }, [businessId]);

  const reviewQuestions =
    useMemo(() => {
      if (
        !business ||
        !Array.isArray(
          business.selectedQuestions
        )
      ) {
        return [];
      }

      return business.selectedQuestions
        .map(
          (
            selectedQuestion,
            index
          ) => {
            if (
              selectedQuestion &&
              typeof selectedQuestion ===
              "object" &&
              selectedQuestion.question
            ) {
              const options =
                Array.isArray(
                  selectedQuestion.options
                )
                  ? selectedQuestion.options
                    .map(
                      (
                        option,
                        optionIndex
                      ) => {
                        const text =
                          getOptionText(
                            option
                          );

                        if (!text) {
                          return null;
                        }

                        return {
                          ...(option &&
                            typeof option ===
                            "object"
                            ? option
                            : {}),
                          id:
                            option?.id ||
                            `${selectedQuestion.id ||
                            index
                            }-${optionIndex}`,
                          text,
                        };
                      }
                    )
                    .filter(Boolean)
                  : [];

              return {
                ...selectedQuestion,
                id:
                  selectedQuestion.id ||
                  `saved-question-${index + 1
                  }`,
                question:
                  String(
                    selectedQuestion.question
                  ).trim(),
                options,
                professionalOptions:
                  getProfessionalOptionLabels(
                    selectedQuestion,
                    options.length
                  ),
              };
            }

            const question =
              questions.find(
                (item) =>
                  item.id ===
                  selectedQuestion
              );

            if (!question) {
              return null;
            }

            const options =
              Array.isArray(
                question.options
              )
                ? question.options
                : [];

            return {
              ...question,
              options,
              professionalOptions:
                getProfessionalOptionLabels(
                  question,
                  options.length
                ),
            };
          }
        )
        .filter(Boolean);
    }, [
      business,
      questions,
    ]);

  const recordActivity =
    async (
      event,
      extraData = {}
    ) => {
      if (!business?.id) {
        return;
      }

      try {
        await recordReviewActivity(
          business.id,
          event,
          extraData.answers || [],
          extraData.generatedReview ||
          ""
        );
      } catch (err) {
        console.error(
          "Failed to record review activity:",
          err
        );
      }
    };

  const handleAnswer = (
    optionIndex
  ) => {
    const question =
      reviewQuestions[
      currentQuestion
      ];

    if (!question) {
      return;
    }

    const option =
      question.options[
      optionIndex
      ];

    const score =
      getOptionScoreByIndex(
        optionIndex,
        question.options.length
      );

    const updatedAnswers = {
      ...answers,
      [question.id]: {
        index: optionIndex,
        text: getOptionText(
          option
        ),
        originalText:
          getOptionText(
            option
          ),
        score,
        type:
          getAnswerTypeByScore(
            score
          ),
      },
    };

    setAnswers(
      updatedAnswers
    );

    if (
      currentQuestion <
      reviewQuestions.length - 1
    ) {
      setCurrentQuestion(
        (current) =>
          current + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    handleFinish(
      updatedAnswers
    );
  };

  const overallRating =
    useMemo(() => {
      if (!reviewQuestions.length) {
        return 0;
      }

      const answeredQuestions =
        reviewQuestions.filter(
          (question) =>
            answers[
            question.id
            ]
        );

      if (
        !answeredQuestions.length
      ) {
        return 0;
      }

      const total =
        answeredQuestions.reduce(
          (
            sum,
            question
          ) =>
            sum +
            (
              answers[
                question.id
              ]?.score || 3
            ),
          0
        );

      return (
        Math.round(
          (total /
            answeredQuestions.length) *
          10
        ) / 10
      );
    }, [
      answers,
      reviewQuestions,
    ]);

  const filledRatingStars =
    Math.round(
      overallRating
    );

  const getSentenceKey = (
    sentence
  ) =>
    String(sentence || "")
      .toLowerCase()
      .replace(
        /[^\p{L}\p{N}\s]/gu,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  const [
    usedReviewSentences,
    setUsedReviewSentences,
  ] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          `reviewqr_used_sentences_${window.location.pathname}`
        ) || "[]"
      );
    } catch {
      return [];
    }
  });

  const [
    usedReviewHistory,
    setUsedReviewHistory,
  ] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          `reviewqr_used_reviews_${window.location.pathname}`
        ) || "[]"
      );
    } catch {
      return [];
    }
  });

  const saveUsedReviewSentences =
    (sentences = []) => {
      try {
        const key =
          `reviewqr_used_sentences_${window.location.pathname}`;

        const existing =
          JSON.parse(
            localStorage.getItem(
              key
            ) || "[]"
          );

        const unique = [
          ...new Set([
            ...existing,
            ...sentences.map(
              getSentenceKey
            ),
          ]),
        ].filter(Boolean);

        localStorage.setItem(
          key,
          JSON.stringify(unique)
        );

        setUsedReviewSentences(
          unique
        );
      } catch (err) {
        console.warn(
          "Could not save review sentence history:",
          err
        );
      }
    };

  const getReviewKey = (
    review
  ) =>
    String(review || "")
      .toLowerCase()
      .replace(
        /[^a-z0-9\s]/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  const getStoredReviewHistory =
    () => {
      try {
        return JSON.parse(
          localStorage.getItem(
            `reviewqr_used_reviews_${window.location.pathname}`
          ) || "[]"
        );
      } catch {
        return [];
      }
    };

  const saveUsedReview = (
    review
  ) => {
    try {
      const key =
        `reviewqr_used_reviews_${window.location.pathname}`;

      const reviewKey =
        getReviewKey(
          review
        );

      if (!reviewKey) {
        return;
      }

      const updated = [
        ...new Set([
          ...getStoredReviewHistory(),
          reviewKey,
        ]),
      ];

      localStorage.setItem(
        key,
        JSON.stringify(updated)
      );

      setUsedReviewHistory(
        updated
      );
    } catch (err) {
      console.warn(
        "Could not save review history:",
        err
      );
    }
  };

  const generateReviewOnce =
    (
      answerState = answers
    ) => {
      if (!business) {
        return "";
      }

      const selected =
        reviewQuestions
          .map((question) => {
            const answer =
              answerState[
              question.id
              ];

            if (!answer) {
              return null;
            }

            const score =
              answer.score ??
              getOptionScoreByIndex(
                answer.index,
                question.options.length
              );

            return {
              question,
              score,
              type:
                getAnswerTypeByScore(
                  score
                ),
              topic:
                getQuestionTopic(
                  question
                ),
            };
          })
          .filter(Boolean);

      if (!selected.length) {
        return "";
      }

      const positive =
        selected.filter(
          (item) =>
            item.type ===
            "positive"
        );

      const negative =
        selected.filter(
          (item) =>
            item.type ===
            "negative"
        );

      const businessName =
        String(
          business.name ||
          "the business"
        ).trim();

      let randomState =
        (
          Date.now() +
          generationNumber * 7919 +
          Math.floor(
            Math.random() *
            2147483647
          )
        ) >>> 0;

      const nextRandom = () => {
        randomState =
          (
            randomState *
            1664525 +
            1013904223
          ) >>> 0;

        return (
          randomState /
          4294967296
        );
      };

      const shuffle = (
        items
      ) => {
        const copy = [
          ...items,
        ];

        for (
          let i =
            copy.length - 1;
          i > 0;
          i--
        ) {
          const j =
            Math.floor(
              nextRandom() *
              (i + 1)
            );

          [
            copy[i],
            copy[j],
          ] = [
              copy[j],
              copy[i],
            ];
        }

        return copy;
      };

      const clean = (
        sentence
      ) =>
        String(sentence || "")
          .replace(
            /[?؟]+/g,
            ""
          )
          .replace(
            /\s+/g,
            " "
          )
          .trim();

      const roleFromQuestion =
        (question) => {
          const match =
            String(
              question?.question ||
              ""
            ).match(
              /\b(dermatologist|doctor|physician|specialist|dentist|therapist|surgeon|nurse|practitioner|clinician|consultant)\b/i
            );

          return match
            ? match[1]
            : "doctor";
        };

      /*
       * Build natural, complete thoughts. Do not attach generic
       * sentence fragments to a complete sentence: that creates
       * repetitive and grammatically disconnected reviews.
       */
      const topicPhrases = {
        booking: {
          positive: ["booking was quick and straightforward", "arranging the visit was easy"],
          neutral: ["booking was fairly straightforward", "arranging the visit was manageable"],
          negative: ["booking took more effort than it should have", "arranging the visit was frustrating"]
        },
        reception: {
          positive: ["the reception team gave me a warm welcome", "the staff at the front desk were friendly and helpful", "I was greeted in a friendly way when I arrived", "the welcome made a good first impression", "the check-in experience felt welcoming", "the people at reception made the arrival easy"],
          neutral: ["the welcome at reception was polite but fairly routine", "the front desk handled things adequately"],
          negative: ["the welcome at reception felt impersonal", "the front desk staff could have been more welcoming"]
        },
        doctor_attention: {
          positive: ["the {role} listened carefully and took my concerns seriously", "the {role} took the time to understand what I needed", "I appreciated that the {role} gave my concerns proper attention", "the consultation felt attentive rather than rushed", "the {role} made an effort to understand my situation", "I felt heard during my discussion with the {role}"],
          neutral: ["the {role} addressed my main concerns, although the discussion felt brief", "the {role} covered the basics but could have discussed things in more detail"],
          negative: ["the {role} seemed rushed and did not spend enough time listening", "I did not feel that the {role} fully addressed my concerns"]
        },
        doctor: {
          positive: ["the {role} was professional and reassuring", "the consultation was handled with care and confidence"],
          neutral: ["the consultation was satisfactory, though fairly routine", "the care was reasonable but could have been more thorough"],
          negative: ["the consultation felt rushed and lacked detail", "the care fell short of what I had expected"]
        },
        staff: {
          positive: ["the staff were friendly and helpful", "everyone I spoke with was polite and approachable"],
          neutral: ["the staff were polite, although the service felt routine", "the team handled my requests adequately"],
          negative: ["the staff could have been more attentive", "some interactions felt less helpful than they should have"]
        },
        service: {
          positive: ["the service was smooth and attentive", "everything was handled efficiently and professionally"],
          neutral: ["the service was acceptable, though nothing particularly stood out", "things went reasonably well, with some room for improvement"],
          negative: ["the service felt inconsistent", "the overall service fell short of my expectations"]
        },
        cleanliness: {
          positive: ["the place was clean and well maintained", "the surroundings looked neat and hygienic", "the overall upkeep was reassuring", "I noticed that the shared areas were kept tidy", "cleanliness seemed to be taken seriously", "the space looked cared for rather than neglected"],
          neutral: ["the place was reasonably clean, although a few areas could be better maintained", "the cleanliness was acceptable overall"],
          negative: ["the place could have been cleaner", "some areas needed more attention to hygiene and upkeep"]
        },
        ambience: {
          positive: ["the atmosphere was relaxed and welcoming", "the setting made the visit more enjoyable"],
          neutral: ["the atmosphere was pleasant enough but not especially memorable", "the setting was fine, although it could feel more inviting"],
          negative: ["the atmosphere felt less welcoming than I expected", "the surroundings could have been more inviting"]
        },
        comfort: {
          positive: ["the place was comfortable and easy to relax in", "I felt at ease throughout the visit", "the setting made it easy to settle in", "I found the environment pleasant to spend time in", "the overall setup felt relaxed and practical", "I was able to feel comfortable during my time there"],
          neutral: ["the comfort level was adequate for the visit", "the setting was comfortable enough, though it could be improved"],
          negative: ["the setting was less comfortable than I expected", "it was difficult to feel fully comfortable during the visit"]
        },
        safety: {
          positive: ["I felt safe throughout my visit", "the arrangements gave me confidence in my safety", "I was comfortable with the security arrangements", "safety did not feel like a concern during my time there", "the environment gave me peace of mind", "I had no worries about my personal safety"],
          neutral: ["the safety arrangements seemed adequate", "I felt reasonably comfortable with the arrangements"],
          negative: ["the arrangements did not give me much confidence", "I had concerns about the sense of security"]
        },
        value: {
          positive: ["the prices felt fair for the quality", "the experience offered good value for the money", "what I received felt worth the amount paid", "the cost seemed reasonable for the overall standard", "I thought the pricing was fair", "the experience matched what I would expect at that price"],
          neutral: ["the pricing seemed reasonable, although I expected a little more for the cost", "the value was acceptable but not particularly impressive"],
          negative: ["the prices felt high for what I received", "the experience did not offer enough value for the cost"]
        },
        speed: {
          positive: ["everything moved quickly without feeling rushed", "there was very little waiting and the process ran smoothly"],
          neutral: ["the waiting time was manageable, although things could have moved faster", "the timing was acceptable but not especially quick"],
          negative: ["the wait was longer than expected", "the process moved slowly and could have been better organised"]
        },
        communication: {
          positive: ["everything was explained clearly", "communication was clear and I knew what to expect"],
          neutral: ["the main points were clear, although a few details could have been explained better", "communication was adequate but could have been clearer"],
          negative: ["some explanations were unclear", "I was left with questions that could have been answered more clearly"]
        },
        food: {
          positive: ["the food was tasty and well prepared", "I enjoyed the flavour and freshness of the food", "the meals were enjoyable and had a nice flavour", "I was pleased with how the food was prepared", "the food added a nice touch to the stay", "the meals were satisfying without being overcomplicated"],
          neutral: ["the food was decent but did not particularly stand out", "the meal was fine, although the flavour could have been better"],
          negative: ["the food did not meet my expectations", "the meal could have been fresher and more flavourful"]
        },
        room: {
          positive: ["the room was clean, comfortable and well maintained", "the accommodation was pleasant and looked after", "the room felt ready for a comfortable stay", "the living space was tidy and thoughtfully kept", "the accommodation met my needs well", "the room was in good condition when I arrived"],
          neutral: ["the room was adequate, although a few details could be improved", "the accommodation covered the basics"],
          negative: ["the room needed better upkeep", "the accommodation was less comfortable than I expected"]
        },
        location: {
          positive: ["the location was convenient and easy to reach", "getting there was simple"],
          neutral: ["the location was reasonably convenient", "getting there was manageable, though not especially easy"],
          negative: ["the location was less convenient than I expected", "getting there was more difficult than it needed to be"]
        },
        facilities: {
          positive: ["the facilities were well maintained and had what I needed", "the available amenities made the visit more convenient", "the amenities covered the things I needed during my stay", "having those facilities on hand was genuinely useful", "the available features made day-to-day things easier", "the facilities were practical and added to the overall experience"],
          neutral: ["the facilities covered the basics", "the amenities were adequate, although a few additions would help"],
          negative: ["the facilities were limited", "some amenities needed improvement"]
        },
        quality: {
          positive: ["the quality was impressive", "the standard of work was consistently good"],
          neutral: ["the quality was acceptable but not outstanding", "the standard was reasonable, with some room to improve"],
          negative: ["the quality fell short of my expectations", "the standard was not as good as I had hoped"]
        },
        delivery: {
          positive: ["the order arrived on time and in good condition", "the delivery was prompt and handled carefully"],
          neutral: ["the order arrived without major issues", "the delivery was acceptable, though the process could be smoother"],
          negative: ["the delivery took longer than expected", "the order could have been handled more carefully"]
        },
        billing: {
          positive: ["the bill was clear and payment was straightforward", "checkout was quick and there were no confusing charges"],
          neutral: ["the payment process was manageable", "the billing was fine, although a little more clarity would help"],
          negative: ["the billing process was confusing", "the charges could have been explained more clearly"]
        },
        parking: {
          positive: ["parking was easy to find", "the parking arrangements were convenient"],
          neutral: ["parking was manageable, although it was not especially convenient", "the parking arrangements were adequate"],
          negative: ["finding parking was difficult", "the parking arrangements added unnecessary inconvenience"]
        },
        recommendation: {
          positive: ["I would happily recommend the place to others", "I would feel comfortable suggesting it to friends"],
          neutral: ["I might recommend it, depending on what someone is looking for", "a few improvements would make it easier to recommend"],
          negative: ["I would hesitate to recommend it in its current state", "I would want to see some improvements before recommending it"]
        },
        overall: {
          positive: ["the experience was enjoyable overall", "I left with a good impression", "several parts of the visit worked particularly well", "overall, the experience met my expectations", "I found the experience worthwhile", "the visit had enough positives to stand out"],
          neutral: ["the experience was fine overall, though not especially memorable", "there were good points as well as areas to improve"],
          negative: ["the experience fell short of my expectations", "I left feeling disappointed with some aspects of the visit"]
        }
      };

      const getCandidates = (item) => {
        const topic = item.topic || "overall";
        const type = item.type || "neutral";
        const phrases = topicPhrases[topic]?.[type] || topicPhrases.overall[type];
        const role = roleFromQuestion(item.question);
        return phrases.map((phrase) => clean(phrase.replace(/\{role\}/g, role)));
      };

      const openingPools = {
        positive: [
          `I had a genuinely pleasant visit to ${businessName}.`,
          `My visit to ${businessName} left a very good impression on me.`,
          `I was pleasantly surprised by how smoothly everything went at ${businessName}.`,
          `The time I spent at ${businessName} turned out to be quite enjoyable.`,
          `There was a lot to like about my visit to ${businessName}.`,
          `I had a really good visit to ${businessName}.`,
          `My experience at ${businessName} was a positive one.`,
          `I was happy with how my visit to ${businessName} turned out.`,
          `Spending time at ${businessName} was a good experience.`,
          `I came away from ${businessName} feeling satisfied.`,
          `Overall, I enjoyed my time at ${businessName}.`,
          `A few things made my visit to ${businessName} stand out in a good way.`,
          `I found my experience at ${businessName} better than expected.`,
          `My time at ${businessName} went well from the start.`,
          `I had a worthwhile experience at ${businessName}.`,
        ],

        neutral: [
          `My visit to ${businessName} was fairly average.`,
          `I had a reasonable visit to ${businessName}, although a few things could be better.`,
          `My visit to ${businessName} had some positives as well as a few areas that need attention.`,
          `My time at ${businessName} was generally fine, though not perfect.`,
          `The visit to ${businessName} was decent, with a few areas that could improve.`,
        ],

        negative: [
          `My visit to ${businessName} was not quite what I had hoped for.`,
          `I had a few concerns about my visit to ${businessName}.`,
          `Unfortunately, my visit to ${businessName} fell short of my expectations.`,
          `My recent visit to ${businessName} could have been better.`,
          `I left ${businessName} feeling that a few things needed more attention.`,
        ],
      };

      const tone =
        positive.length >
          negative.length
          ? "positive"
          : negative.length >
            positive.length
            ? "negative"
            : "neutral";

      const used =
        new Set();

      const usedOpenings =
        new Set();

      /*
       * Read localStorage every time.
       * This is important because setState() is asynchronous.
       * React state alone is not enough to prevent an immediate
       * duplicate during Generate Another.
       */
      const getCurrentHistory =
        () => {
          const history =
            new Set(
              usedReviewSentences
            );

          try {
            const key =
              `reviewqr_used_sentences_${window.location.pathname}`;

            const stored =
              JSON.parse(
                localStorage.getItem(
                  key
                ) || "[]"
              );

            stored.forEach(
              (item) =>
                history.add(item)
            );
          } catch {
            // Keep in-memory history.
          }

          return history;
        };
      const openingKey =
        (sentence) =>
          clean(sentence)
            .toLowerCase()
            .split(/\s+/)
            .slice(0, 4)
            .join(" ");

      const chooseUnused = (
        candidates,
        isOpening = false
      ) => {
        const history =
          getCurrentHistory();

        let available =
          shuffle(
            candidates
              .map(clean)
              .filter(Boolean)
          ).filter(
            (sentence) => {
              const key =
                getSentenceKey(
                  sentence
                );

              return (
                key &&
                !history.has(key) &&
                !used.has(key)
              );
            }
          );

        if (
          isOpening &&
          available.length
        ) {
          const openingSafe =
            available.filter(
              (sentence) =>
                !usedOpenings.has(
                  openingKey(
                    sentence
                  )
                )
            );

          if (
            openingSafe.length
          ) {
            available =
              openingSafe;
          }
        }

        // Prefer sentences that have never been used, but do not
        // let a finite phrase library make the review blank.
        // First relax the global history restriction, while still
        // avoiding duplicates inside this review. If necessary,
        // allow a locally-used option as the final fallback.
        if (!available.length) {
          available = shuffle(
            candidates
              .map(clean)
              .filter(Boolean)
          ).filter((sentence) =>
            !used.has(getSentenceKey(sentence))
          );
        }

        if (!available.length) {
          available = shuffle(
            candidates.map(clean).filter(Boolean)
          );
        }

        if (!available.length) {
          return "";
        }

        const selected =
          available[
          Math.floor(
            nextRandom() *
            available.length
          )
          ];

        const key =
          getSentenceKey(
            selected
          );

        used.add(key);

        if (isOpening) {
          usedOpenings.add(
            openingKey(
              selected
            )
          );
        }

        return selected;
      };

      const chosenPhrases = [];
      const opening = chooseUnused(openingPools[tone], true);

      /*
       * Use a small number of details and combine them into
       * flowing sentences. Mentioning every answer separately
       * makes a review read like a checklist.
       */
      const shuffledAnswers = shuffle(selected);

      /*
       * Avoid describing the same idea twice under different topics.
       * For example, "room was comfortable" and "easy to relax"
       * overlap, as do ambience/comfort and staff/reception.
       * Keep one detail from each semantic family so the review
       * covers more distinct parts of the visit.
       */
      const topicFamily = {
        room: "space",
        comfort: "space",
        ambience: "space",
        cleanliness: "space",
        reception: "people",
        staff: "people",
        doctor: "care",
        doctor_attention: "care",
        service: "service",
        speed: "service",
        booking: "process",
        billing: "process",
        value: "cost",
        food: "food",
        safety: "safety",
        location: "location",
        facilities: "facilities",
        quality: "quality",
        delivery: "delivery",
        parking: "parking",
        communication: "communication",
        recommendation: "recommendation",
        overall: "overall",
      };

      const selectedFamilies = new Set();
      const distinctAnswers = [];

      for (const item of shuffledAnswers) {
        const family = topicFamily[item.topic] || item.topic;
        if (selectedFamilies.has(family)) continue;
        selectedFamilies.add(family);
        distinctAnswers.push(item);
      }

      const detailLimit = Math.min(4, distinctAnswers.length);

      for (let i = 0; i < detailLimit; i++) {
        const item = distinctAnswers[i];
        const phrase = chooseUnused(getCandidates(item));
        if (phrase) {
          chosenPhrases.push({ phrase, topic: item.topic, type: item.type });
        }
      }

      const sentences = [];
      if (opening) sentences.push(opening);

      const phraseToSentence = (phrase) =>
        phrase.charAt(0).toUpperCase() + phrase.slice(1).replace(/[.!?]+$/, "") + ".";

      // Pair details where possible, using natural conjunctions.
      for (let i = 0; i < chosenPhrases.length; i += 2) {
        const first = chosenPhrases[i];
        const second = chosenPhrases[i + 1];

        if (!second) {
          sentences.push(phraseToSentence(first.phrase));
          continue;
        }

        const a = first.phrase.replace(/[.!?]+$/, "");
        const b = second.phrase.replace(/[.!?]+$/, "");
        const conjunctions = [
          `${a}, and ${b}.`,
          `${a}. ${b.charAt(0).toUpperCase()}${b.slice(1)}.`,
          `${a}, and ${b}.`
        ];
        const combined = chooseUnused(conjunctions);
        if (combined) {
          sentences.push(phraseToSentence(combined).replace(/\.\./g, "."));
        } else {
          sentences.push(phraseToSentence(a));
          sentences.push(phraseToSentence(b));
        }
      }

      if (positive.length && negative.length) {
        const balance = positive.length >= negative.length
          ? [
              "There were a couple of small things that could be better, but overall the positives stood out more",
              "Although not everything was perfect, I was still happy with most of the experience"
            ]
          : [
              "There were a few good points, but the areas that need improvement affected my overall impression",
              "Some parts went well, although the problems were harder to overlook"
            ];
        const balanceSentence = chooseUnused(balance);
        if (balanceSentence) sentences.push(phraseToSentence(balanceSentence));
      }

      const closingPools = {
        positive: [
          "I would happily return",
          "I would gladly choose this place again",
          "I would be happy to come back",
          "I would recommend giving this place a try",
          "I came away satisfied and would return",
          "I would keep this place in mind for another visit",
          "I would be comfortable choosing this place again",
          "I would be pleased to return in the future",
          "It was a worthwhile visit and I would come back",
          "I would happily consider this place again",
          "I would recommend it to someone looking for this kind of place",
          "I would gladly return if the opportunity came up",
          "I would consider coming back",
          "I would be open to another visit",
          "I would choose this place again for a similar need",
          "I left feeling that the visit was worth my time"
        ],
        neutral: [
          "A few changes could make the next visit better",
          "There is room for improvement, but the experience was acceptable",
          "I would consider returning if the weaker areas were addressed",
          "With a little more attention to detail, this could be a better experience",
          "The experience was reasonable, though not especially memorable",
          "Some improvements would make me more confident about returning",
          "I hope the areas that need work receive more attention",
          "I would keep this place in mind, with a few reservations",
          "The overall experience was fair, but it could be smoother",
          "I might return after seeing some improvements"
        ],
        negative: [
          "I hope these concerns are taken seriously",
          "I would need to see improvements before considering another visit",
          "The experience left me hesitant to return",
          "I hope future visitors have a smoother experience",
          "I would reconsider visiting once these issues are addressed",
          "There is clear room to improve the overall experience",
          "I cannot say I would return based on this visit",
          "I hope the service becomes more consistent",
          "The experience did not give me much reason to come back",
          "I would be more willing to return after meaningful improvements"
        ]
      };

      const closing = chooseUnused(closingPools[tone]);
      if (closing) sentences.push(phraseToSentence(closing));

      const finalSentences = [
        ...new Map(
          sentences.map(
            (sentence) => [
              getSentenceKey(
                sentence
              ),
              clean(sentence),
            ]
          )
        ).values(),
      ].filter(Boolean);

      // Do not save history here: this function may be called many
      // times while searching for a unique full review. Saving here
      // would exhaust the phrase library during failed attempts.
      return finalSentences.join(" ");
    };

  const generateReview =
    async (
      answerState = answers
    ) => {
      /*
       * Try many combinations.
       * Each attempt reads the current localStorage sentence
       * history, so sentences consumed by a previous attempt in
       * the SAME generation cannot come back.
       */
      let lastCandidate = "";

      for (let attempt = 0; attempt < 60; attempt++) {
        const candidate = generateReviewOnce(answerState);
        if (!candidate) continue;

        lastCandidate = candidate;
        const history = new Set(
          [...usedReviewHistory, ...getStoredReviewHistory()].map(getReviewKey)
        );

        if (!history.has(getReviewKey(candidate))) {
          // Only save sentence history for the final, accepted review.
          const sentences = candidate.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [candidate];
          saveUsedReviewSentences(sentences);
          saveUsedReview(candidate);
          return candidate;
        }
      }

      // The phrase library is finite. If every full combination has
      // already been used, reuse the latest valid candidate rather
      // than clearing the review textarea.
      if (lastCandidate) {
        const sentences = lastCandidate.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [lastCandidate];
        saveUsedReviewSentences(sentences);
        saveUsedReview(lastCandidate);
        return lastCandidate;
      }

      // Last-resort safety net: build a readable review from the
      // selected answers without requiring unused-history entries.
      const fallback = generateReviewOnce(answerState);
      if (fallback) {
        saveUsedReviewSentences(fallback.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [fallback]);
        saveUsedReview(fallback);
        return fallback;
      }

      return "We couldn't generate a review from the selected answers. Please try again.";
    };

  const handleFinish =
    async (
      answerState = answers
    ) => {
      setGenerationNumber(
        (number) =>
          number + 1
      );

      const review =
        await generateReview(
          answerState
        );

      setGeneratedReview(
        review
      );

      setReviewGenerated(
        true
      );

      recordActivity(
        "generated",
        {
          answers:
            reviewQuestions.map(
              (item) => ({
                questionId:
                  item.id,
                question:
                  item.question,
                answer:
                  answerState[
                  item.id
                  ],
              })
            ),
          generatedReview:
            review,
        }
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const handleStart =
    () => {
      if (
        !reviewQuestions.length
      ) {
        return;
      }

      setStarted(true);

      setGenerationNumber(
        (number) =>
          number + 1
      );

      recordActivity(
        "started"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const handlePrevious =
    () => {
      if (
        currentQuestion > 0
      ) {
        setCurrentQuestion(
          (current) =>
            current - 1
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    };

  const handleRegenerate =
    async () => {
      setGenerationNumber(
        (number) =>
          number + 1
      );

      const review =
        await generateReview(
          answers
        );

      setGeneratedReview(
        review
      );
    };


  const handleOpenGoogleReview = async () => {
    const raw = business?.googleReviewUrl?.trim();

    if (!raw) {
      alert("Google Review URL is not configured for this business.");
      return;
    }

    let validUrl;

    try {
      validUrl = new URL(raw);

      if (!["http:", "https:"].includes(validUrl.protocol)) {
        throw new Error();
      }
    } catch {
      alert("The Google Review URL is invalid.");
      return;
    }

    let copied = false;

    try {
      await navigator.clipboard.writeText(generatedReview);
      copied = true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = generatedReview;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        copied = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      alert("Unable to copy your review. Please copy it manually.");
      return;
    }

    setShowCopyPopup(true);

    window.setTimeout(() => {
      window.location.href = validUrl.href;
    }, 3000);

    await recordActivity("google_opened", {
      answers: reviewQuestions.map((question) => ({
        questionId: question.id,
        question: question.question,
        answer: answers[question.id],
      })),
      generatedReview,
    });
  };

  if (loading) {
    return (
      <div className="review-page">
        <div className="review-loading">
          <div className="review-spinner" />

          <p>
            Loading review experience...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-page">
        <div className="review-error-page">
          <div className="review-error-icon">
            !
          </div>

          <h1>
            Review page unavailable
          </h1>

          <p>
            {error}
          </p>

          <span>
            Please check the QR code and
            try again.
          </span>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="review-page">
        <div className="review-error-page">
          <div className="review-error-icon">
            !
          </div>

          <h1>
            Business not found
          </h1>

          <p>
            We couldn't find this business.
          </p>
        </div>
      </div>
    );
  }

  if (
    !reviewQuestions.length
  ) {
    return (
      <div className="review-page">
        <div className="review-error-page">
          <div className="review-error-icon">
            !
          </div>

          <h1>
            Review unavailable
          </h1>

          <p>
            No review questions are
            currently configured for this
            business.
          </p>
        </div>
      </div>
    );
  }

  if (reviewGenerated) {
    return (
      <div className="review-page">
        <div className="review-container review-result-container">
          <div className="review-topbar">
            <div className="review-brand">
              <div className="review-brand-icon">
                <Icon
                  name="qr"
                  size={19}
                />
              </div>

              <span>
                ReviewQR
              </span>
            </div>

            <span className="review-business-name">
              {business.name}
            </span>
          </div>

          <div className="review-result-card">
            <div className="review-result-success-icon">
              <Icon
                name="review"
                size={28}
              />

              <span
                className="review-result-sparkle"
                aria-hidden="true"
              >
                🎉
              </span>
            </div>

            <span className="review-result-eyebrow">
              YOUR REVIEW
            </span>

            <h1>
              Your review is ready
            </h1>

            <p className="review-result-description">
              We created this review from
              your answers. You can edit it
              before opening Google.
            </p>

            <div className="review-result-business">
              <div className="review-result-business-icon">
                <Icon
                  name="business"
                  size={17}
                />
              </div>

              <div>
                <strong>
                  {business.name}
                </strong>

                {business.category && (
                  <span>
                    {business.category}
                  </span>
                )}
              </div>
            </div>

            <div className="review-overall-rating">
              <span className="review-rating-label">
                Overall Rating
              </span>

              <div
                className="review-rating-stars"
                aria-label={`Overall rating ${overallRating.toFixed(
                  1
                )} out of 5`}
              >
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <span
                      key={star}
                      className={`review-rating-star ${star <=
                          filledRatingStars
                          ? "filled"
                          : ""
                        }`}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  )
                )}
              </div>

              <span className="review-rating-value">
                {overallRating.toFixed(
                  1
                )}{" "}
                / 5
              </span>

              <span className="review-rating-note">
                Calculated automatically from your answers
              </span>
            </div>

            <div className="review-text-wrapper">
              <div className="review-text-header">
                <span>
                  Generated Review
                </span>

                <span>
                  Editable
                </span>
              </div>

              <textarea
                className="generated-review-text"
                value={
                  generatedReview
                }
                onChange={(event) =>
                  setGeneratedReview(
                    event.target.value
                  )
                }
                rows={8}
              />
            </div>

            {showCopyPopup && (
              <div className="review-popup-overlay" role="status" aria-live="polite">
                <div className="review-popup">
                  <div className="review-popup-check">✓</div>
                  <h3>Your review has been copied!</h3>
                  <p>
                    Please paste your review on Google Reviews.
                  </p>
                  <p className="review-popup-redirect">
                    Redirecting to Google Reviews in 3 seconds...
                  </p>
                </div>
              </div>
            )}

            <div className="review-result-actions">
              <button
                type="button"
                className="review-google-button"
                onClick={
                  handleOpenGoogleReview
                }
              >
                Copy and Paste Review

                <Icon
                  name="arrow"
                  size={16}
                />
              </button>

              <button
                type="button"
                className="review-regenerate-button"
                onClick={
                  handleRegenerate
                }
              >
                Generate Another

                <Icon
                  name="refresh"
                  size={16}
                />
              </button>
            </div>
          </div>

          <div
            className="review-copy-hint"
            role="status"
          >
            <span
              className="review-copy-hint-icon"
              aria-hidden="true"
            >
              i
            </span>

            <span className="review-copy-hint-text">
              <strong>
                Your review will be
                copied automatically.
              </strong>

              <span>
                Open Google Review
                and paste it into
                the experience box.
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="review-page">
        <div className="review-container">
          <div className="review-brand">
            <div className="review-brand-icon">
              <Icon
                name="qr"
                size={21}
              />
            </div>

            <span>
              ReviewQR
            </span>
          </div>

          <div className="review-welcome-card">
            <div className="review-welcome-icon">
              <Icon
                name="review"
                size={30}
              />

              <span
                className="review-welcome-sparkle"
                aria-hidden="true"
              >
                ✨
              </span>
            </div>

            <span className="review-eyebrow">
              SHARE YOUR EXPERIENCE
            </span>

            <h1>
              How was your experience
              with{" "}
              <strong>
                {business.name}
              </strong>
              ?
            </h1>

            <p>
              Answer a few quick questions
              and we'll help you create your
              review.
            </p>

            <div className="review-business-chip">
              <div className="review-business-chip-icon">
                <Icon
                  name="business"
                  size={17}
                />
              </div>

              <div>
                <strong>
                  {business.name}
                </strong>

                {business.category && (
                  <span>
                    {business.category}
                  </span>
                )}
              </div>
            </div>

            <div className="review-time-info">
              <span>
                <Icon
                  name="questions"
                  size={15}
                />

                {reviewQuestions.length}{" "}
                questions
              </span>

              <span>
                •
              </span>

              <span>
                Takes about 1 minute
              </span>
            </div>

            <button
              type="button"
              className="review-start-button"
              onClick={
                handleStart
              }
            >
              Start Review

              <Icon
                name="arrow"
                size={17}
              />
            </button>
          </div>

          <p className="review-footer-text">
            Your answers help create a review
            based on your actual experience.
          </p>
        </div>
      </div>
    );
  }

  const question =
    reviewQuestions[
    currentQuestion
    ];

  if (!question) {
    return null;
  }

  const selectedAnswer =
    answers[
    question.id
    ];

  const progress =
    ((currentQuestion + 1) /
      reviewQuestions.length) *
    100;

  return (
    <div className="review-page">
      <div className="review-container review-question-container">
        <div className="review-topbar">
          <div className="review-brand">
            <div className="review-brand-icon">
              <Icon
                name="qr"
                size={19}
              />
            </div>

            <span>
              ReviewQR
            </span>
          </div>

          <span className="review-business-name">
            {business.name}
          </span>
        </div>

        <div className="review-progress-section">
          <div className="review-progress-top">
            <span>
              Question{" "}
              {currentQuestion + 1}{" "}
              of{" "}
              {reviewQuestions.length}
            </span>

            <strong>
              {Math.round(
                progress
              )}
              %
            </strong>
          </div>

          <div className="review-progress-bar">
            <div
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div
          key={currentQuestion}
          className="review-question-card"
        >
          <span className="review-question-label">
            QUESTION{" "}
            {String(
              currentQuestion + 1
            ).padStart(
              2,
              "0"
            )}
          </span>

          <h1>
            {question.question}
          </h1>

          <p className="review-question-help">
            Select an option to continue.
            The next question will appear automatically.
          </p>

          <div className="review-options">
            {question.options.map(
              (
                option,
                optionIndex
              ) => {
                const professionalText =
                  question
                    .professionalOptions[
                  optionIndex
                  ] ||
                  getOptionText(
                    option
                  );

                const selected =
                  selectedAnswer?.index ===
                  optionIndex;

                return (
                  <button
                    type="button"
                    key={
                      option.id ||
                      `${question.id}-${optionIndex}`
                    }
                    className={`review-option ${selected
                        ? "selected"
                        : ""
                      }`}
                    onClick={() =>
                      handleAnswer(
                        optionIndex
                      )
                    }
                  >
                    <span
                      className="review-option-emoji"
                      aria-hidden="true"
                    >
                      {getOptionEmoji(
                        optionIndex,
                        question
                          .options
                          .length
                      )}
                    </span>

                    <span className="review-option-text">
                      {
                        professionalText
                      }
                    </span>

                    <span
                      className="review-option-radio"
                      aria-hidden="true"
                    >
                      {selected && (
                        <span />
                      )}
                    </span>

                    {selected && (
                      <Icon
                        name="arrow"
                        size={15}
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="review-navigation">
          <button
            type="button"
            className="review-back-button"
            onClick={
              handlePrevious
            }
            disabled={
              currentQuestion ===
              0
            }
          >
            <Icon
              name="arrow"
              size={15}
            />

            Back
          </button>
        </div>

        <p className="review-question-footer">
          Your responses are used to create
          a review based on your experience.
        </p>
      </div>
    </div>
  );
};

export default Review;