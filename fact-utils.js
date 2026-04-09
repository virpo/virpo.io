(function attachFactUtils() {
  const HEADLINE_OVERRIDES = {
    "01-14": "Elvis goes live by satellite",
    "01-03": "First landing on the Moon's far side",
    "01-10": "London Underground opens",
    "01-19": "Japan lands on the Moon",
    "01-24": "Japan launches its first Moon probe",
    "01-29": "Benz patents the car",
    "02-03": "Luna 9 lands on the Moon",
    "02-06": "First microchip patent",
    "02-22": "First TB antibiotic is announced",
    "02-29": "Columbus wins with a lunar eclipse",
    "03-06": "DNA double helix is described",
    "03-07": "Bell patents the telephone",
    "03-12": "The web is proposed at CERN",
    "03-17": "First solar-powered satellite launches",
    "03-18": "First spacewalk",
    "03-29": "First flyby of Mercury",
    "03-31": "First orbit around the Moon",
    "04-01": "First TV picture from space",
    "04-02": "First movie theater opens",
    "04-06": "First commercial satellite launches",
    "04-07": "IBM announces System/360",
    "04-10": "Potosi is founded after silver is found",
    "04-12": "Yuri Gagarin reaches space",
    "04-13": "First satellite navigation system",
    "04-16": "India's first passenger rail opens",
    "04-17": "Earth-size planet is confirmed",
    "04-19": "First helicopter flight on Mars",
    "04-22": "Optical fiber carries phone calls",
    "04-24": "Hubble launches",
    "04-30": "The web becomes free",
    "05-01": "Pluto gets its name",
    "05-05": "First American reaches space",
    "05-23": "Paris and Rome connect by telephone",
    "05-24": "Helicopter makes first true flight",
    "06-02": "First U.S. landing on another world",
    "06-10": "Spirit rover launches",
    "06-12": "First bicycle takes a ride",
    "06-15": "First nonstop Atlantic flight",
    "06-19": "Eratosthenes measures the Earth",
    "07-03": "Benz unveils the first real car",
    "07-10": "First communications satellite launches",
    "07-14": "First close-up photos of Mars",
    "07-18": "First photo lands on the web",
    "07-25": "Plane crosses the English Channel",
    "07-31": "Apollo 15 gets a lunar rover",
    "08-12": "Space Shuttle Enterprise flies free",
    "08-19": "Photography becomes permanent",
    "08-20": "Voyager 2 launches",
    "08-22": "Voyager 2 spots Neptune's ring",
    "08-23": "First photo of Earth from Moon orbit",
    "08-25": "Voyager 1 enters interstellar space",
    "08-29": "First motorcycle is patented",
    "08-31": "Zeppelin patents the airship",
    "09-01": "First woman works a phone switchboard",
    "09-03": "Viking 2 lands on Mars",
    "09-13": "First fixed-wing flight in Europe",
    "09-20": "First American gas car hits the road",
    "09-24": "India reaches Mars on first try",
    "09-27": "First steam railway opens",
    "10-04": "Sputnik 1 reaches orbit",
    "10-19": "First TB antibiotic is found",
    "10-21": "Edison files light bulb patent",
    "11-08": "X-ray is discovered",
    "11-20": "Windows 1.0 launches",
    "11-21": "First untethered balloon flight",
    "11-25": "CT scanner gets a patent",
    "12-01": "Buenos Aires Metro begins",
    "12-11": "First radio signal crosses the Atlantic",
    "12-23": "Transistor makes its debut",
    "12-30": "First metro opens in Tokyo",
  };

  const LANE_OVERRIDES = {
    "01-14": "Music",
    "01-10": "City",
    "01-28-lego": "Design",
    "12-30": "City",
    "12-01": "City",
    "03-31-eiffel": "Architecture",
    "04-01-bauhaus": "Design",
    "04-02": "Movie",
    "05-17-color-photo": "Visual",
    "08-19": "Visual",
    "10-06-talkie": "Movie",
    "10-20-opera-house": "Architecture",
    "12-11": "Media",
    "10-21": "Invention",
    "02-06": "Invention",
    "03-07": "Invention",
    "12-23": "Invention",
    "11-08": "Medicine",
    "11-25": "Medicine",
    "02-22": "Medicine",
    "03-06": "Discovery",
    "06-12": "Transport",
    "08-31": "Transport",
    "09-01": "People",
    "07-14": "Space",
    "04-19": "Space",
    "01-19": "Space",
    "03-18": "Space",
  };

  const KNOWN_SUBJECTS = [
    ["Thomas Edison", "Edison"],
    ["Christopher Columbus", "Columbus"],
    ["Wilhelm Rontgen", "Rontgen"],
    ["Wilhelm Röntgen", "Rontgen"],
    ["Yuri Gagarin", "Yuri Gagarin"],
    ["Voyager 2", "Voyager 2"],
    ["Apollo 15 astronauts", "Apollo 15"],
    ["Apollo 15", "Apollo 15"],
    ["Ingenuity helicopter", "Ingenuity"],
    ["Paris and Rome", "Paris and Rome"],
    ["The Ginza Line", "Ginza Line"],
    ["Metropolitan Railway", "London Underground"],
    ["The Metropolitan Railway", "London Underground"],
    ["Eratosthenes", "Eratosthenes"],
  ];

  function normalizeWhitespace(text) {
    return String(text).replace(/\s+/g, " ").trim();
  }

  function cleanupEventText(record) {
    let text = String(record.event || "").replace(/\.$/, "");
    text = text.replace(/^Apollo program:\s*/i, "");
    text = text.replace(/^Project Apollo:\s*/i, "");
    text = text.replace(/^Project Mercury:\s*/i, "");
    text = text.replace(/^Space Race:\s*/i, "");
    text = text.replace(/^The Japan Aerospace Exploration Agency's probe/i, "Japan");
    text = text.replace(/^The Soviet cosmonaut /i, "");
    text = text.replace(/\s*\([^)]*\)/g, "");
    return normalizeWhitespace(text);
  }

  function shortenSubject(subject) {
    const trimmed = normalizeWhitespace(subject).replace(/^the\s+/i, "");
    for (const [source, replacement] of KNOWN_SUBJECTS) {
      if (trimmed === source) return replacement;
    }

    if (/ and his brother$/i.test(trimmed)) {
      return trimmed.replace(/ and his brother$/i, "");
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && /^[A-Z]/.test(parts[0]) && /^[A-Z]/.test(parts[parts.length - 1])) {
      return parts[parts.length - 1];
    }

    return trimmed;
  }

  function buildFactHeadline(record) {
    if (!record) return "";
    if (HEADLINE_OVERRIDES[record.dateKey]) return HEADLINE_OVERRIDES[record.dateKey];

    const text = cleanupEventText(record);

    const directPatterns = [
      [/^(.+?) applies for a patent for (?:his design for )?an? (.+)$/i, (_, subject, object) => `${shortenSubject(subject)} files patent for ${object}`],
      [/^(.+?) announces (.+)$/i, (_, subject, object) => `${shortenSubject(subject)} announces ${object}`],
      [/^(.+?) unveils (.+)$/i, (_, subject, object) => `${shortenSubject(subject)} unveils ${object}`],
      [/^(.+?) publicly demonstrates (.+)$/i, (_, subject, object) => `${shortenSubject(subject)} unveils ${object}`],
      [/^(.+?) discovers (.+)$/i, (_, subject, object) => `${shortenSubject(subject)} discovers ${object}`],
      [/^(.+?) publishes a paper detailing (.+)$/i, (_, subject, object) => `${shortenSubject(subject)} publishes ${object}`],
      [/^(.+?) are linked by telephone for the first time$/i, (_, places) => `${places} connect by telephone`],
      [/^(.+?) estimates the circumference of the Earth$/i, (_, subject) => `${shortenSubject(subject)} measures the Earth`],
      [/^(.+?) uses a predicted lunar eclipse to win supplies in Jamaica$/i, (_, subject) => `${shortenSubject(subject)} wins with a lunar eclipse`],
      [/^(.+?) becomes the first human to travel into outer space.*$/i, (_, subject) => `${shortenSubject(subject)} reaches space`],
      [/^(.+?) becomes the first aircraft to achieve flight on another planet$/i, () => "First flight on another planet"],
      [/^(.+?) become the first to ride in a lunar rover$/i, (_, subject) => `${shortenSubject(subject)} gets a lunar rover`],
      [/^(.+?) reveals the first complete ring around Neptune$/i, (_, subject) => `${shortenSubject(subject)} spots Neptune's ring`],
      [/^(.+?) lands on the moon.*$/i, (_, subject) => `${shortenSubject(subject)} lands on the Moon`],
      [/^(.+?) is first demonstrated at .+$/i, (_, subject) => `${shortenSubject(subject)} makes its debut`],
      [/^(.+?) is isolated by .+$/i, (_, subject) => `${shortenSubject(subject)} is isolated`],
      [/^A U\.S\. patent is issued for (.+)$/i, (_, object) => `${object} is patented`],
      [/^The first U\.S\. patent for (.+) is issued$/i, (_, object) => `${object} gets a patent`],
      [/^The first U\.S\. commercial transcontinental radio facsimile is sent from .+ to .+$/i, () => "First radio fax crosses America"],
      [/^The first synchrotron releases full energy at .+$/i, () => "First synchrotron switches on"],
      [/^While experimenting with electricity, (.+?) discovers the X-ray$/i, (_, subject) => `${shortenSubject(subject)} discovers X-ray`],
      [/^The Ginza Line, the first subway line in Asia, opens in Tokyo, Japan$/i, () => "Ginza Line opens in Tokyo"],
      [/^The Metropolitan Railway, .+ marking the beginning of the London Underground$/i, () => "London Underground opens"],
      [/^The Ingenuity helicopter becomes the first aircraft to achieve flight on another planet$/i, () => "First flight on another planet"],
      [/^The Japan Aerospace Exploration Agency's probe lands on the moon, making Japan the 5th country to land a spacecraft on the moon$/i, () => "Japan lands on the Moon"],
    ];

    for (const [pattern, resolver] of directPatterns) {
      if (pattern.test(text)) {
        const headline = normalizeWhitespace(text.replace(pattern, resolver));
        return headline;
      }
    }

    let headline = text;
    headline = headline.replace(/^The first /i, "First ");
    headline = headline.replace(/^A /, "");
    headline = headline.replace(/^An /, "");
    headline = headline.replace(/,? the first .*$/i, "");
    headline = headline.replace(/, .*$/, "");
    headline = headline.replace(/\bworld's\b/gi, "");
    headline = headline.replace(/\bpublicly\b/gi, "");
    headline = headline.replace(/\bofficially\b/gi, "");
    headline = headline.replace(/\bthe\s+world's oldest\b/gi, "");
    headline = normalizeWhitespace(headline);

    if (headline.length > 60) {
      headline = headline.split(" ").slice(0, 9).join(" ");
    }

    return headline;
  }

  function countHeadlineWords(text) {
    const clean = normalizeWhitespace(text);
    if (!clean) return 0;
    return clean.split(" ").length;
  }

  function countHeadlineProperNames(text) {
    const matches = String(text).match(/\b[A-Z][a-z]+(?:['-][A-Z]?[a-z]+)?\b/g) || [];
    return matches.length;
  }

  function buildFactLane(record) {
    if (!record) return "Fact";
    if (LANE_OVERRIDES[record.dateKey]) return LANE_OVERRIDES[record.dateKey];

    const headline = buildFactHeadline(record).toLowerCase();
    if (/\bmoon|mars|orbit|space|satellite|hubble|sputnik\b/.test(headline)) return "Space";
    if (/\bmetro|underground|rail|theater|theatre|movie\b/.test(headline)) return "City";
    if (/\bphoto|photography|camera|radio|tv|movie|elvis\b/.test(headline)) return "Media";
    if (/\bx-ray|dna|antibiotic|scanner\b/.test(headline)) return "Medicine";
    if (/\bpatent|telephone|light bulb|microchip|transistor\b/.test(headline)) return "Invention";
    if (/\bbicycle|airship|car\b/.test(headline)) return "Transport";
    if (record.category === "space") return "Space";
    if (record.category === "aviation") return "Flight";
    if (record.category === "vehicles") return "Transport";
    if (record.category === "computing") return "Invention";
    if (record.category === "science") return "Discovery";
    return "Fact";
  }

  window.factUtils = {
    buildFactHeadline,
    buildFactLane,
    cleanupEventText,
    countHeadlineWords,
    countHeadlineProperNames,
  };
})();
