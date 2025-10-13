/**
 * Liturgical Calendar System
 * Provides liturgical calendar utilities and seasonal context for dashboard personalization
 */

// Liturgical seasons and their characteristics
export const LITURGICAL_SEASONS = {
  ADVENT: {
    id: 'advent',
    name: 'Advent',
    color: '#663399', // Purple
    description: 'Season of preparation for Christmas',
    duration: 'weeks', // 4 weeks typically
    themes: ['hope', 'peace', 'joy', 'love'],
    ministryFocus: {
      worship: 'Advent wreaths, special music, scripture readings',
      outreach: 'Community service projects, giving campaigns',
      youth: 'Advent calendars, service projects, Christmas preparation',
      children: 'Advent activities, nativity preparation, crafts',
      evangelism: 'Christmas invitation campaigns, community events',
    },
  },
  CHRISTMAS: {
    id: 'christmas',
    name: 'Christmas',
    color: '#FFD700', // Gold/White
    description: "Celebration of Christ's birth',
    duration: 'days', // 12 days typically
    themes: ['incarnation', 'light', 'joy', 'peace'],
    ministryFocus: {
      worship: 'Christmas services, special music, nativity scenes',
      outreach: 'Gift giving, community meals, family support',
      youth: 'Christmas events, gift drives, family activities',
      children: 'Christmas pageants, gift activities, celebration',
      evangelism: 'Christmas services, community outreach events',
    },
  },
  EPIPHANY: {
    id: 'epiphany',
    name: 'Epiphany',
    color: '#228B22', // Green
    description: 'Manifestation of Christ to the world',
    duration: 'weeks', // Variable length
    themes: ['revelation', 'light', 'mission', 'calling'],
    ministryFocus: {
      worship: 'Baptism of Christ, ordinary time worship',
      outreach: 'Mission emphasis, global awareness',
      youth: 'Mission trips planning, service learning',
      children: 'Stories of Jesus' ministry, mission activities',
      evangelism: 'Outreach planning, evangelism training',
    },
  },
  LENT: {
    id: 'lent',
    name: 'Lent',
    color: '#663399', // Purple
    description: 'Season of repentance and preparation for Easter',
    duration: 'days', // 40 days (excluding Sundays)
    themes: ['repentance', 'fasting', 'prayer', 'almsgiving'],
    ministryFocus: {
      worship: 'Ash Wednesday, Lenten services, stations of cross',
      outreach: 'Lenten giving, justice initiatives, service projects',
      youth: 'Lenten disciplines, service learning, retreat',
      children: 'Lenten activities, simple prayers, giving projects',
      evangelism: 'Alpha courses, seeker studies, invitation to faith',
    },
  },
  HOLY_WEEK: {
    id: 'holy_week',
    name: 'Holy Week',
    color: '#8B0000', // Deep Red
    description: 'The week before Easter, commemorating Christ's passion',
    duration: 'days', // 7 days
    themes: ['sacrifice', 'suffering', 'love', 'commitment'],
    ministryFocus: {
      worship: 'Palm Sunday, Maundy Thursday, Good Friday services',
      outreach: 'Community passion plays, prayer walks',
      youth: 'Passion Week activities, service emphasis',
      children: 'Holy Week stories, simple ceremonies',
      evangelism: 'Good Friday services, Easter invitation preparation',
    },
  },
  EASTER: {
    id: 'easter',
    name: 'Easter',
    color: '#FFFFFF', // White/Gold
    description: 'Celebration of Christ's resurrection',
    duration: 'days', // 50 days (Easter season)
    themes: ['resurrection', 'new life', 'hope', 'victory'],
    ministryFocus: {
      worship: 'Easter services, baptisms, celebration music',
      outreach: 'Easter egg hunts, community celebration',
      youth: 'Easter events, baptism preparation, celebration',
      children: 'Easter activities, resurrection stories, joy celebration',
      evangelism: 'Easter services, new member integration',
    },
  },
  PENTECOST: {
    id: 'pentecost',
    name: 'Pentecost',
    color: '#FF0000', // Red
    description: 'Coming of the Holy Spirit',
    duration: 'day', // Single day, followed by ordinary time
    themes: ['spirit', 'gifts', 'empowerment', 'mission'],
    ministryFocus: {
      worship: 'Pentecost service, spiritual gifts emphasis',
      outreach: 'Mission emphasis, evangelism launch',
      youth: 'Spiritual gifts discovery, mission trips',
      children: 'Holy Spirit activities, gifts exploration',
      evangelism: 'Outreach campaigns, spiritual gifts in evangelism',
    },
  },
  ORDINARY_TIME: {
    id: 'ordinary_time',
    name: 'Ordinary Time',
    color: '#228B22', // Green
    description: 'Seasons of spiritual growth and discipleship',
    duration: 'weeks', // Two periods totaling ~33-34 weeks
    themes: ['growth', 'discipleship', 'service', 'community'],
    ministryFocus: {
      worship: 'Teaching series, discipleship emphasis',
      outreach: 'Ongoing community service, relationship building',
      youth: 'Regular programs, leadership development',
      children: 'Sunday school, spiritual formation',
      evangelism: 'Ongoing outreach, relationship evangelism',
    },
  },
};

// Major feast days and special occasions
export const FEAST_DAYS = {
  CHRISTMAS_EVE: { date: '12-24', season: 'christmas', significance: 'high' },
  CHRISTMAS_DAY: { date: '12-25', season: 'christmas', significance: 'high' },
  NEW_YEARS_EVE: { date: '12-31', season: 'christmas', significance: 'medium' },
  EPIPHANY: { date: '01-06', season: 'epiphany', significance: 'high' },
  ASH_WEDNESDAY: { date: 'calculated', season: 'lent', significance: 'high' },
  PALM_SUNDAY: {
    date: 'calculated',
    season: 'holy_week',
    significance: 'high',
  },
  MAUNDY_THURSDAY: {
    date: 'calculated',
    season: 'holy_week',
    significance: 'high',
  },
  GOOD_FRIDAY: {
    date: 'calculated',
    season: 'holy_week',
    significance: 'high',
  },
  EASTER_SUNDAY: { date: 'calculated', season: 'easter', significance: 'high' },
  PENTECOST_SUNDAY: {
    date: 'calculated',
    season: 'pentecost',
    significance: 'high',
  },
  TRINITY_SUNDAY: {
    date: 'calculated',
    season: 'ordinary_time',
    significance: 'medium',
  },
  ALL_SAINTS_DAY: {
    date: '11-01',
    season: 'ordinary_time',
    significance: 'medium',
  },
  CHRIST_THE_KING: {
    date: 'calculated',
    season: 'ordinary_time',
    significance: 'medium',
  },
};

// Seasonal ministry emphasis suggestions
export const SEASONAL_MINISTRY_THEMES = {
  advent: {
    evangelism: {
      primary: 'Christmas Invitation Campaign',
      activities: [
        'Community Christmas events',
        'Christmas service invitations',
        'Advent community dinners',
      ],
      messaging: 'Come experience the hope of Christmas',
    },
    worship: {
      primary: 'Advent Worship Series',
      activities: [
        'Advent wreath lighting',
        'Special music preparation',
        'Christmas cantata',
      ],
      messaging: 'Preparing our hearts for Christ's coming',
    },
    outreach: {
      primary: 'Christmas Giving Campaign',
      activities: [
        'Toy drives',
        'Family adoption program',
        'Community meal service',
      ],
      messaging: 'Sharing Christ's love through giving',
    },
    youth: {
      primary: 'Advent Service Challenge',
      activities: [
        'Service project countdown',
        'Advent calendar activities',
        'Christmas event planning',
      ],
      messaging: 'Growing in service during Advent',
    },
  },
  lent: {
    evangelism: {
      primary: 'Journey to Easter Series',
      activities: [
        'Alpha course launch',
        'Seeker-friendly Lenten services',
        'Easter invitation preparation',
      ],
      messaging: 'Discover the transforming power of Easter',
    },
    worship: {
      primary: 'Lenten Disciplines',
      activities: [
        'Ash Wednesday service',
        'Weekly Lenten services',
        'Stations of the Cross',
      ],
      messaging: 'Drawing closer to God through spiritual disciplines',
    },
    outreach: {
      primary: 'Lenten Justice Initiative',
      activities: [
        '40 days of service',
        'Community justice projects',
        'Advocacy campaigns',
      ],
      messaging: 'Living out justice during Lent',
    },
    youth: {
      primary: 'Lenten Challenge',
      activities: [
        '40-day spiritual challenge',
        'Service learning projects',
        'Easter preparation',
      ],
      messaging: 'Growing spiritually through Lenten practices",
    },
  },
};

/**
 * Calculate the current liturgical season based on date
 * @param {Date} date - The date to check (defaults to current date)
 * @returns {Object} Current liturgical season info
 */
export function getCurrentLiturgicalSeason(date = new Date()) {
  const year = date.getFullYear();

  // Calculate Easter date (Western calculation)
  const easter = calculateEasterDate(year);

  // Calculate other moveable feasts
  const ashWednesday = new Date(easter.getTime() - 46 * 24 * 60 * 60 * 1000);
  const palmSunday = new Date(easter.getTime() - 7 * 24 * 60 * 60 * 1000);
  const pentecost = new Date(easter.getTime() + 49 * 24 * 60 * 60 * 1000);

  // Fixed dates
  const adventStart = calculateAdventStart(year);
  const christmas = new Date(year, 11, 25); // December 25
  const epiphany = new Date(year, 0, 6); // January 6

  // Determine current season
  const currentDate = new Date(date.getTime());
  currentDate.setHours(0, 0, 0, 0); // Normalize time

  if (currentDate >= adventStart && currentDate < christmas) {
    return {
      ...LITURGICAL_SEASONS.ADVENT,
      startDate: adventStart,
      endDate: new Date(christmas.getTime() - 1),
      weeksRemaining: Math.ceil(
        (christmas - currentDate) / (7 * 24 * 60 * 60 * 1000),
      ),
    };
  }

  if (currentDate >= christmas && currentDate < epiphany) {
    return {
      ...LITURGICAL_SEASONS.CHRISTMAS,
      startDate: christmas,
      endDate: new Date(epiphany.getTime() - 1),
      daysRemaining: Math.ceil(
        (epiphany - currentDate) / (24 * 60 * 60 * 1000),
      ),
    };
  }

  if (currentDate >= epiphany && currentDate < ashWednesday) {
    return {
      ...LITURGICAL_SEASONS.EPIPHANY,
      startDate: epiphany,
      endDate: new Date(ashWednesday.getTime() - 1),
      weeksRemaining: Math.ceil(
        (ashWednesday - currentDate) / (7 * 24 * 60 * 60 * 1000),
      ),
    };
  }

  if (currentDate >= ashWednesday && currentDate < palmSunday) {
    return {
      ...LITURGICAL_SEASONS.LENT,
      startDate: ashWednesday,
      endDate: new Date(palmSunday.getTime() - 1),
      daysRemaining: Math.ceil(
        (palmSunday - currentDate) / (24 * 60 * 60 * 1000),
      ),
    };
  }

  if (currentDate >= palmSunday && currentDate < easter) {
    return {
      ...LITURGICAL_SEASONS.HOLY_WEEK,
      startDate: palmSunday,
      endDate: new Date(easter.getTime() - 1),
      daysRemaining: Math.ceil((easter - currentDate) / (24 * 60 * 60 * 1000)),
    };
  }

  if (currentDate >= easter && currentDate < pentecost) {
    return {
      ...LITURGICAL_SEASONS.EASTER,
      startDate: easter,
      endDate: new Date(pentecost.getTime() - 1),
      daysRemaining: Math.ceil(
        (pentecost - currentDate) / (24 * 60 * 60 * 1000),
      ),
    };
  }

  if (currentDate.getTime() === pentecost.getTime()) {
    return {
      ...LITURGICAL_SEASONS.PENTECOST,
      startDate: pentecost,
      endDate: pentecost,
      daysRemaining: 0,
    };
  }

  // Default to Ordinary Time
  const nextAdvent = calculateAdventStart(year + 1);
  const ordinaryStart =
    currentDate > pentecost
      ? new Date(pentecost.getTime() + 24 * 60 * 60 * 1000)
      : new Date(year, 0, 7); // Week after Epiphany

  return {
    ...LITURGICAL_SEASONS.ORDINARY_TIME,
    startDate: ordinaryStart,
    endDate:
      currentDate > pentecost
        ? new Date(nextAdvent.getTime() - 1)
        : new Date(ashWednesday.getTime() - 1),
    weeksRemaining: Math.ceil(
      (nextAdvent - currentDate) / (7 * 24 * 60 * 60 * 1000),
    ),
  };
}

/**
 * Calculate Easter date for a given year (Western calendar)
 * @param {number} year - The year to calculate Easter for
 * @returns {Date} Easter date
 */
function calculateEasterDate(year) {
  // Using the anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Calculate the start of Advent for a given year
 * @param {number} year - The year to calculate Advent for
 * @returns {Date} First Sunday of Advent
 */
function calculateAdventStart(year) {
  const christmas = new Date(year, 11, 25); // December 25
  const christmasDay = christmas.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate the Sunday before (or of) Christmas
  const sundayBefore = new Date(christmas);
  sundayBefore.setDate(christmas.getDate() - christmasDay);

  // Advent starts 4 Sundays before
  const adventStart = new Date(sundayBefore);
  adventStart.setDate(sundayBefore.getDate() - 21); // 3 weeks before

  return adventStart;
}

/**
 * Get ministry-specific seasonal content suggestions
 * @param {string} seasonId - The liturgical season ID
 * @param {string} ministryType - The ministry type (e.g., 'worship', 'outreach')
 * @returns {Object} Seasonal content suggestions
 */
export function getSeasonalMinistryContent(seasonId, ministryType) {
  const seasonThemes = SEASONAL_MINISTRY_THEMES[seasonId];
  const seasonInfo = LITURGICAL_SEASONS[seasonId];

  if (!seasonThemes || !seasonInfo) {
    return {
      primary: 'Regular Ministry Activities',
      activities: [
        'Ongoing programs',
        'Regular services',
        'Community engagement',
      ],
      messaging: 'Faithful ministry in all seasons',
      themes: ['service', 'community', 'growth'],
    };
  }

  const ministryTheme = seasonThemes[ministryType] || seasonThemes.worship;

  return {
    ...ministryTheme,
    themes: seasonInfo.themes,
    color: seasonInfo.color,
    seasonName: seasonInfo.name,
    seasonDescription: seasonInfo.description,
  };
}

/**
 * Get upcoming feast days and special occasions
 * @param {Date} startDate - Start date for search
 * @param {number} daysAhead - Number of days to look ahead
 * @returns {Array} Array of upcoming feast days
 */
export function getUpcomingFeastDays(startDate = new Date(), daysAhead = 30) {
  const upcomingDays = [];
  const endDate = new Date(
    startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000,
  );

  Object.entries(FEAST_DAYS).forEach(([name, feastInfo]) => {
    let feastDate;

    if (feastInfo.date === 'calculated') {
      // Handle calculated dates (Easter-based)
      const year = startDate.getFullYear();
      const easter = calculateEasterDate(year);

      switch (name) {
        case 'ASH_WEDNESDAY':
          feastDate = new Date(easter.getTime() - 46 * 24 * 60 * 60 * 1000);
          break;
        case 'PALM_SUNDAY':
          feastDate = new Date(easter.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'MAUNDY_THURSDAY':
          feastDate = new Date(easter.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case 'GOOD_FRIDAY':
          feastDate = new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000);
          break;
        case 'EASTER_SUNDAY':
          feastDate = easter;
          break;
        case 'PENTECOST_SUNDAY':
          feastDate = new Date(easter.getTime() + 49 * 24 * 60 * 60 * 1000);
          break;
        case 'TRINITY_SUNDAY':
          feastDate = new Date(easter.getTime() + 56 * 24 * 60 * 60 * 1000);
          break;
        case 'CHRIST_THE_KING': {
          // Last Sunday before Advent
          const advent = calculateAdventStart(year);
          feastDate = new Date(advent.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        }
        default:
          return; // Skip unknown calculated dates
      }
    } else {
      // Handle fixed dates
      const [month, day] = feastInfo.date.split('-').map(Number);
      feastDate = new Date(startDate.getFullYear(), month - 1, day);

      // If the date has passed this year, check next year
      if (feastDate < startDate) {
        feastDate = new Date(startDate.getFullYear() + 1, month - 1, day);
      }
    }

    // Check if feast day is within our time range
    if (feastDate >= startDate && feastDate <= endDate) {
      upcomingDays.push({
        name: name
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        date: feastDate,
        season: feastInfo.season,
        significance: feastInfo.significance,
        daysUntil: Math.ceil((feastDate - startDate) / (24 * 60 * 60 * 1000)),
      });
    }
  });

  // Sort by date
  return upcomingDays.sort((a, b) => a.date - b.date);
}

/**
 * Get seasonal dashboard theme configuration
 * @param {string} seasonId - The liturgical season ID
 * @returns {Object} Theme configuration
 */
export function getSeasonalTheme(seasonId) {
  const season = LITURGICAL_SEASONS[seasonId];
  if (!season) return getSeasonalTheme('ordinary_time');

  return {
    primaryColor: season.color,
    seasonName: season.name,
    description: season.description,
    themes: season.themes,
    cssVariables: {
      '--seasonal-primary': season.color,
      '--seasonal-accent': adjustColorLightness(season.color, 20),
      '--seasonal-light': adjustColorLightness(season.color, 40),
      '--seasonal-background': adjustColorLightness(season.color, 95),
    },
  };
}

/**
 * Adjust color lightness for theme variations
 * @param {string} color - Hex color code
 * @param {number} percent - Percentage to lighten (positive) or darken (negative)
 * @returns {string} Adjusted hex color
 */
function adjustColorLightness(color, percent) {
  // Simple lightness adjustment - in production, use a proper color library
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
