import webpush from 'web-push';
import { read, write } from './store.js';
import { getFestivals, dueFestivals } from './festivals.js';

const ready = () => Boolean(
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
);

// Festival-specific messages.
// More specific names must be checked before broader names.
function festivalWish(name) {
  const festival = String(name || '').toLowerCase();

  // HINDU FESTIVALS

  if (/dhanteras|dhantrayodashi/.test(festival)) {
    return 'May this auspicious occasion bring good health, prosperity, and light into your home. 🪔';
  }

  if (/ekadashi.*parana|parana.*ekadashi/.test(festival)) {
    return 'May this sacred observance bring peace, devotion, and spiritual strength. 🙏';
  }

  if (/naraka chaturdashi|choti diwali/.test(festival)) {
    return 'May light overcome darkness and bring hope, courage, and positivity into your life. 🪔';
  }

  if (/diwali|deepavali/.test(festival)) {
    return 'May the glow of every diya bring peace to your heart, happiness to your home, and brightness to your journey. 🪔✨';
  }

  if (/govardhan puja|annakut/.test(festival)) {
    return 'May this sacred celebration inspire gratitude, devotion, and harmony with nature. 🌿🙏';
  }

  if (/bhai dooj|bhaiya dooj/.test(festival)) {
    return 'May the beautiful bond between brothers and sisters grow stronger with love and blessings. ❤️';
  }

  if (/ugadi|yugadi|gudi padwa/.test(festival)) {
    return 'May this new beginning bring fresh hope, prosperity, and beautiful opportunities. శుభ ఉగాది! 🌿';
  }

  if (/makar sankranti|sankranti|pongal|lohri/.test(festival)) {
    return 'May this harvest celebration fill your life with gratitude, abundance, and joyful beginnings. 🌾☀️';
  }

  if (/holika dahan/.test(festival)) {
    return 'May goodness overcome negativity and inspire courage, renewal, and hope. 🔥';
  }

  if (/holi/.test(festival)) {
    return 'May the colors of this celebration bring joy, friendship, and harmony into your life. 🌈';
  }

  if (/ganesh|vinayaka|ganapati/.test(festival)) {
    return 'May Lord Ganesha bless your journey with wisdom, courage, and the strength to overcome obstacles. 🙏';
  }

  if (/chhath/.test(festival)) {
    return 'May this sacred observance bring gratitude, well-being, and blessings to your family. ☀️🙏';
  }

  if (/navratri|dussehra|dasara|vijayadashami/.test(festival)) {
    return 'May courage, goodness, and wisdom guide you toward peaceful beginnings and new victories. 🌺';
  }

  if (/janmashtami|krishna jayanti/.test(festival)) {
    return 'May the teachings of Lord Krishna inspire love, wisdom, and inner peace. 🪈';
  }

  if (/rama navami|ram navami|ramanavami/.test(festival)) {
    return 'May the values of truth, kindness, and righteousness illuminate your path. 🙏';
  }

  if (/maha shivaratri|mahashivaratri|shivaratri/.test(festival)) {
    return 'May this sacred occasion inspire inner strength, stillness, and spiritual clarity. ॐ नमः शिवाय! 🙏';
  }

  if (/raksha bandhan|rakhi/.test(festival)) {
    return 'May the bonds of love, care, and protection grow stronger every day. ❤️';
  }

  if (/hanuman jayanti/.test(festival)) {
    return 'May Lord Hanuman inspire courage, devotion, humility, and strength in your life. 🙏';
  }

  if (/varalakshmi/.test(festival)) {
    return 'May Goddess Lakshmi bless your family with well-being, harmony, and prosperity. 🌸';
  }

  if (/onam/.test(festival)) {
    return 'May Onam bring togetherness, prosperity, gratitude, and happiness to your home. 🌼';
  }

  if (/vasant panchami|basant panchami|saraswati puja/.test(festival)) {
    return 'May wisdom, creativity, and learning brighten your journey. 📚🌼';
  }

  // ISLAMIC FESTIVALS AND OBSERVANCES

  if (/eid.*(fitr|ul.fitr|al.fitr)/.test(festival)) {
    return 'Eid Mubarak! May this blessed celebration bring peace, generosity, and happiness to your loved ones. 🌙';
  }

  if (/eid.*(adha|ul.adha|al.adha)|bakrid|bakra eid/.test(festival)) {
    return 'Eid Mubarak! May this occasion inspire faith, compassion, generosity, and togetherness. 🌙';
  }

  if (/ramadan|ramzan/.test(festival)) {
    return 'May this sacred month bring patience, reflection, compassion, and spiritual growth. 🌙';
  }

  if (/laylat.*qadr|shab.e.qadr/.test(festival)) {
    return 'May this blessed night inspire prayer, reflection, forgiveness, and peace. 🌙';
  }

  if (/muharram|ashura/.test(festival)) {
    return 'May this solemn observance inspire reflection, compassion, justice, and peace.';
  }

  if (/milad|mawlid|eid.e.milad/.test(festival)) {
    return 'May this observance inspire kindness, compassion, faith, and service to others. 🌙';
  }

  if (/islamic new year|hijri new year/.test(festival)) {
    return 'May the new Hijri year bring peace, faith, hope, and meaningful beginnings. 🌙';
  }

  if (/eid|id.ul|id ul/.test(festival)) {
    return 'May this blessed occasion bring peace, compassion, and happiness to you and your loved ones. 🌙';
  }

  // CHRISTIAN FESTIVALS AND OBSERVANCES

  if (/good friday/.test(festival)) {
    return 'May this solemn day inspire reflection, compassion, sacrifice, and hope. ✝️';
  }

  if (/easter/.test(festival)) {
    return 'May Easter bring renewed hope, peace, love, and the joy of new beginnings. ✨';
  }

  if (/christmas/.test(festival)) {
    return 'May your home be filled with warmth, kindness, peace, and the joy of togetherness. 🎄';
  }

  if (/palm sunday/.test(festival)) {
    return 'May this sacred Sunday inspire humility, faith, and peaceful reflection. 🌿';
  }

  if (/ash wednesday|lent/.test(festival)) {
    return 'May this season of reflection inspire compassion, renewal, and spiritual growth.';
  }

  if (/pentecost/.test(festival)) {
    return 'May this sacred celebration bring renewed faith, wisdom, and unity. 🕊️';
  }

  if (/advent/.test(festival)) {
    return 'May this season of preparation bring hope, peace, patience, and love. 🕯️';
  }

  // SIKH FESTIVALS

  if (/guru nanak/.test(festival)) {
    return 'May Guru Nanak Dev Ji’s teachings of equality, compassion, and selfless service guide your life. 🙏';
  }

  if (/guru gobind singh/.test(festival)) {
    return 'May the teachings of Guru Gobind Singh Ji inspire courage, justice, and selfless service. 🙏';
  }

  if (/vaisakhi|baisakhi/.test(festival)) {
    return 'May Vaisakhi bring gratitude, prosperity, courage, and a spirit of togetherness. 🌾';
  }

  if (/bandi chhor/.test(festival)) {
    return 'May Bandi Chhor Divas inspire freedom, compassion, justice, and hope. 🪔';
  }

  if (/gurpurab|guru.*jayanti/.test(festival)) {
    return 'May this Gurpurab inspire wisdom, equality, kindness, and service to humanity. 🙏';
  }

  // BUDDHIST FESTIVALS

  if (/buddha purnima|buddha jayanti|vesak|wesak/.test(festival)) {
    return 'May the teachings of Buddha inspire compassion, mindfulness, wisdom, and inner peace. 🪷';
  }

  if (/asala puja|dhamma day/.test(festival)) {
    return 'May this observance deepen wisdom, compassion, and mindful living. 🪷';
  }

  if (/magha puja/.test(festival)) {
    return 'May this sacred observance inspire kindness, harmony, and mindful action. 🪷';
  }

  // JAIN FESTIVALS

  if (/mahavir jayanti|mahavira jayanti/.test(festival)) {
    return 'May Lord Mahavira’s teachings of nonviolence, truth, and compassion guide your life. 🙏';
  }

  if (/paryushan|paryushana/.test(festival)) {
    return 'May this sacred period inspire self-reflection, forgiveness, discipline, and inner peace. 🙏';
  }

  if (/samvatsari/.test(festival)) {
    return 'On this day of forgiveness, may understanding, compassion, and peace guide every relationship. Michhami Dukkadam. 🙏';
  }

  if (/jain.*diwali/.test(festival)) {
    return 'May this sacred occasion inspire spiritual wisdom, liberation, and inner light. 🪔';
  }

  // OTHER CULTURAL AND RELIGIOUS OBSERVANCES

  if (/nowruz|navroz|norooz/.test(festival)) {
    return 'May this new year bring renewal, peace, prosperity, and beautiful beginnings. 🌱';
  }

  if (/hanukkah|chanukah/.test(festival)) {
    return 'May this Festival of Lights bring hope, resilience, warmth, and joy. 🕎';
  }

  if (/passover|pesach/.test(festival)) {
    return 'May this sacred celebration inspire freedom, gratitude, and togetherness.';
  }

  if (/rosh hashanah/.test(festival)) {
    return 'May the new year bring peace, reflection, hope, and sweetness. 🍎';
  }

  if (/yom kippur/.test(festival)) {
    return 'May this solemn day inspire reflection, forgiveness, and renewal.';
  }

  // GENERAL OBSERVANCES

  if (/ekadashi|pradosh|amavasya|purnima/.test(festival)) {
    return `On ${name}, may your observance bring peace, devotion, and inner clarity. 🙏`;
  }

  // Safe fallback for an unrecognized festival.
  return `On ${name}, may this occasion bring meaningful moments, harmony, and peace to you and your loved ones. ✨`;
}

export async function runNotifications({
  dryRun = false,
  now = new Date()
} = {}) {

  if (!dryRun && !ready()) {
    throw new Error('VAPID keys not configured');
  }

  if (ready()) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  const users = read('subscriptions', []);
  const sent = read('sent', {});

  // Use the same date for festival lookup and scheduling.
  const festivals = await getFestivals(now);

  let attempted = 0;
  let delivered = 0;

  for (const user of users) {
    if (!user.enabled) continue;

    let due;

    try {
      due = dueFestivals(festivals, user, now);
    } catch (error) {
      console.error(
        'Festival matching failed:',
        error.message
      );
      continue;
    }

    for (const festival of due) {

      const key =
        `${user.id}|${festival.id}|${festival.date}`;

      // Prevent duplicate notifications.
      if (sent[key]) continue;

      attempted++;

      // Never send during dry-run testing.
      if (dryRun) continue;

      const payload = {
        title: `VYOMA · ${festival.name}`,
        body: festivalWish(festival.name),
        url: '/'
      };

      try {
        await webpush.sendNotification(
          user.subscription,
          JSON.stringify(payload),
          { TTL: 86400 }
        );

        sent[key] = new Date().toISOString();
        write('sent', sent);

        delivered++;

      } catch (error) {

        // Disable subscriptions that no longer exist.
        if (
          error.statusCode === 404 ||
          error.statusCode === 410
        ) {
          user.enabled = false;
          write('subscriptions', users);
        }

        console.error(
          'Push delivery failed:',
          error.statusCode || error.message
        );
      }
    }
  }

  return {
    users: users.length,
    festivals: festivals.length,
    attempted,
    delivered,
    dryRun
  };
}