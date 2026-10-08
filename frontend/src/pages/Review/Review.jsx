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
                              `${
                                selectedQuestion.id ||
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
                  `saved-question-${
                    index + 1
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
       * IMPORTANT:
       * Every base sentence has many natural variations.
       * We NEVER fall back to an already-used sentence.
       */

      const variants = {
        positive: [
          ". A detail I genuinely appreciated.",
          ". One of the better parts of the visit for me.",
          ". Something that made the visit easier.",
          ". A small touch that stood out in a good way.",
          ". Something I was particularly happy with.",
          ". A detail that added to the visit.",
          ". One part that left a good impression on me.",
          ". Something that made a noticeable difference.",
          ". A nice part of the visit.",
          ". One of the things I liked most.",
          ". A detail that made things feel more comfortable.",
          ". Something that worked especially well for me.",
          ". One part I would happily mention to someone else.",
          ". A small thing that made the experience better.",
          ". Something I found reassuring.",
          ". One aspect that felt well handled.",
        ],

        neutral: [
          ". Something that worked reasonably well for my visit.",
          ". A part that was fine for what I needed.",
          ". Nothing major, although there is still room to improve.",
          ". A fairly routine part of the visit.",
          ". Something that met my basic expectations.",
          ". A detail that was acceptable without standing out.",
          ". One area where a little more attention could help.",
          ". Something that was manageable for this visit.",
          ". A part that could be made a little smoother.",
          ". Something I found adequate overall.",
          ". An aspect that was fine, though not especially memorable.",
          ". A detail that could benefit from some refinement.",
          ". Something that worked without causing a major issue.",
          ". A fairly ordinary part of the visit.",
          ". One detail that could be strengthened.",
          ". Something I would describe as satisfactory.",
        ],

        negative: [
          ". A detail I would have liked to see handled better.",
          ". One area that could use more attention.",
          ". Something that took away from the visit.",
          ". A part that left me wanting more.",
          ". A detail that was noticeable for the wrong reasons.",
          ". One aspect I would improve.",
          ". Something that could have been handled more smoothly.",
          ". A point that affected my impression of the visit.",
          ". One area where a better approach would help.",
          ". A detail that did not work as well as expected.",
          ". Something I hope receives more attention in future.",
          ". One part that could have been more polished.",
          ". A detail that made the visit less comfortable.",
          ". Something that could have been more consistent.",
          ". One point that I found disappointing.",
          ". An aspect that needs more attention.",
        ],
      };

      const getCandidates =
        (item) => {
          const topic =
            item.topic ||
            "overall";

          const type =
            item.type ||
            "neutral";

          let bases =
            LIBRARY[
              topic
            ]?.[type] ||
            LIBRARY.overall[
              type
            ] ||
            [];

          if (
            topic === "doctor" ||
            topic ===
              "doctor_attention"
          ) {
            const role =
              roleFromQuestion(
                item.question
              );

            bases =
              bases.map(
                (sentence) =>
                  sentence.replace(
                    /\bthe doctor\b/gi,
                    `the ${role}`
                  )
              );
          }

          return bases.flatMap(
            (base) => {
              const cleanBase =
                clean(base);

              return [
                cleanBase,
                ...(
                  variants[
                    type
                  ] || []
                ).map(
                  (ending) =>
                    `${cleanBase.replace(
                      /[.!?]+$/,
                      ""
                    )}${ending}`
                ),
              ];
            }
          );
        };

      const openingPools = {
        positive: [
          `I had a genuinely pleasant visit to ${businessName}.`,
          `My visit to ${businessName} left a very good impression on me.`,
          `I was pleasantly surprised by how smoothly everything went at ${businessName}.`,
          `The time I spent at ${businessName} turned out to be quite enjoyable.`,
          `There was a lot to like about my visit to ${businessName}.`,
          `I had a really good visit to ${businessName}.`,
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

        if (
          !available.length
        ) {
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

      const sentences = [];

      const opening =
        chooseUnused(
          openingPools[tone],
          true
        );

      if (opening) {
        sentences.push(
          opening
        );
      }

      const shuffledAnswers =
        shuffle(
          selected
        );

      const detailLimit =
        Math.min(
          6,
          shuffledAnswers.length
        );

      for (
        let i = 0;
        i < detailLimit;
        i++
      ) {
        const sentence =
          chooseUnused(
            getCandidates(
              shuffledAnswers[i]
            )
          );

        if (sentence) {
          sentences.push(
            sentence
          );
        }
      }

      if (
        positive.length &&
        negative.length
      ) {
        const balance =
          positive.length >=
          negative.length
            ? [
                "There were a few small concerns, but the better parts of the visit had a stronger impact on me.",
                "Although everything was not perfect, the good aspects outweighed the weaker ones.",
                "A few things could be better, but the positives were more noticeable to me.",
              ]
            : [
                "There were some good moments, but the weaker areas were more noticeable to me.",
                "Although a few things went well, the issues had a stronger effect on my visit.",
                "Some parts worked nicely, but the areas needing improvement affected my impression more.",
              ];

        const balanceSentence =
          chooseUnused(
            balance
          );

        if (
          balanceSentence
        ) {
          sentences.push(
            balanceSentence
          );
        }
      }

      const closingPools = {
        positive: [
          "I would be happy to return based on this visit.",
          "I left with a good feeling about the place.",
          "It was a visit I would generally look back on positively.",
          "I would be comfortable coming back again.",
          "I would gladly consider another visit.",
        ],

        neutral: [
          "There is definitely room to make the experience better.",
          "With a few improvements, the experience could be stronger.",
          "It was an okay visit, but there is still scope for improvement.",
          "A little more consistency would make the experience better.",
          "A few small changes would make a noticeable difference.",
        ],

        negative: [
          "I hope some of these areas receive more attention in the future.",
          "With better attention to these points, the experience could be much stronger.",
          "I would like to see some improvement before considering another visit.",
          "Addressing these issues would make a meaningful difference.",
          "I hope the weaker areas are improved going forward.",
        ],
      };

      const closing =
        chooseUnused(
          closingPools[tone]
        );

      if (closing) {
        sentences.push(
          closing
        );
      }

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

      saveUsedReviewSentences(
        finalSentences
      );

      return finalSentences.join(
        " "
      );
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
      for (
        let attempt = 0;
        attempt < 250;
        attempt++
      ) {
        const candidate =
          generateReviewOnce(
            answerState
          );

        if (!candidate) {
          continue;
        }

        const history =
          new Set(
            [
              ...usedReviewHistory,
              ...getStoredReviewHistory(),
            ].map(
              getReviewKey
            )
          );

        if (
          !history.has(
            getReviewKey(
              candidate
            )
          )
        ) {
          saveUsedReview(
            candidate
          );

          return candidate;
        }
      }

      /*
       * IMPORTANT:
       * Do NOT fall back to an old review.
       * Repeating an old sentence is worse than returning empty.
       */
      return "";
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

  const handleOpenGoogleReview =
    async () => {
      const raw =
        business?.googleReviewUrl?.trim();

      if (!raw) {
        alert(
          "Google Review URL is not configured for this business."
        );
        return;
      }

      let validUrl;

      try {
        validUrl =
          new URL(raw);

        if (
          ![
            "http:",
            "https:",
          ].includes(
            validUrl.protocol
          )
        ) {
          throw new Error();
        }
      } catch {
        alert(
          "The Google Review URL is invalid."
        );
        return;
      }

      try {
        await navigator.clipboard.writeText(
          generatedReview
        );
      } catch {
        try {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            generatedReview;

          textarea.style.position =
            "fixed";

          textarea.style.left =
            "-9999px";

          document.body.appendChild(
            textarea
          );

          textarea.focus();
          textarea.select();

          document.execCommand(
            "copy"
          );

          document.body.removeChild(
            textarea
          );
        } catch {
          // Ignore clipboard fallback errors.
        }
      }

      await recordActivity(
        "google_opened",
        {
          answers:
            reviewQuestions.map(
              (question) => ({
                questionId:
                  question.id,
                question:
                  question.question,
                answer:
                  answers[
                    question.id
                  ],
              })
            ),
          generatedReview,
        }
      );

      window.location.href =
        validUrl.href;
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
                      className={`review-rating-star ${
                        star <=
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

            <div className="review-result-actions">
              <button
                type="button"
                className="review-google-button"
                onClick={
                  handleOpenGoogleReview
                }
              >
                Open Google Review

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
                    className={`review-option ${
                      selected
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