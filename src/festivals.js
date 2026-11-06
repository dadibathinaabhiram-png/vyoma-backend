const API_URL = 'https://panchang.devdarsha.com/v1/panchang/daily';

const CITY_BY_REGION = {
  'IN-AP': 'tirupati'
};

export async function getFestivals(now = new Date()) {
  const apiKey = process.env.DEVDARSHA_API_KEY;

  if (!apiKey) {
    throw new Error('DEVDARSHA_API_KEY missing');
  }

  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      date,
      city_id: CITY_BY_REGION['IN-AP'],	
      faith_filter: 'all'
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(
      `DevDarsha API returned HTTP ${response.status}`
    );
  }

  const result = await response.json();

  const festivals = result.data?.festivals?.data || [];

  return festivals.map(festival => ({
    id: festival.id,
    name: festival.name,
    date,
    message: festival.note ||
      `Reminder: ${festival.name} is observed today.`,
    regions: ['IN-AP']
  }));
}

export function localParts(time, zone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(time);

  const value = key =>
    parts.find(part => part.type === key).value;

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number(value('hour'))
  };
}

export function dueFestivals(festivals, user, time) {
  const { date, hour } = localParts(time, user.timeZone);

  if (hour !== user.sendHour) return [];

  return festivals.filter(festival =>
    festival.date === date &&
    (!festival.regions ||
      festival.regions.includes(user.region))
  );
}