export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  // 1. ACTION: SEND OTP
  if (action === 'send-otp' || req.url.includes('/send-otp')) {
    try {
      const { phoneNumber, dialingCode = '91', countryCode = 'IN' } = req.body || {};
      const cleanDigits = String(phoneNumber || '').replace(/\D/g, '').slice(-10);

      const postData = {
        countryCode: countryCode,
        dialingCode: parseInt(dialingCode, 10),
        phoneNumber: cleanDigits,
        region: 'region-2',
        sequenceNo: 2,
        installationDetails: {
          app: { buildVersion: 5, majorVersion: 11, minorVersion: 7, store: 'GOOGLE_PLAY' },
          device: {
            deviceId: 'c1f7a8b9e0d1c2b3',
            language: 'en',
            manufacturer: 'Samsung',
            model: 'SM-G975F',
            osName: 'Android',
            osVersion: '10',
            mobileServices: ['GMS']
          },
          language: 'en'
        }
      };

      const resp = await fetch('https://account-asia-south1.truecaller.com/v2/sendOnboardingOtp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json; charset=UTF-8',
          'accept-encoding': 'gzip',
          'user-agent': 'Truecaller/11.75.5 (Android;10)',
          'clientsecret': 'lvc22mp3l1sfv6ujg83rd17btt'
        },
        body: JSON.stringify(postData)
      });

      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. ACTION: VERIFY OTP
  if (action === 'verify-otp' || req.url.includes('/verify-otp')) {
    try {
      const { phoneNumber, dialingCode = '91', countryCode = 'IN', requestId, otp } = req.body || {};
      const cleanDigits = String(phoneNumber || '').replace(/\D/g, '').slice(-10);

      const postData = {
        countryCode: countryCode,
        dialingCode: parseInt(dialingCode, 10),
        phoneNumber: cleanDigits,
        requestId: requestId,
        token: String(otp || '').trim()
      };

      const resp = await fetch('https://account-asia-south1.truecaller.com/v1/verifyOnboardingOtp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json; charset=UTF-8',
          'accept-encoding': 'gzip',
          'user-agent': 'Truecaller/11.75.5 (Android;10)',
          'clientsecret': 'lvc22mp3l1sfv6ujg83rd17btt'
        },
        body: JSON.stringify(postData)
      });

      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // 3. ACTION: SEARCH NUMBER
  const searchPhone = req.query.phone || (req.body && req.body.phone);
  const searchCountry = req.query.countryCode || (req.body && req.body.countryCode) || '91';
  const installationId = req.headers.authorization?.replace('Bearer ', '') || req.query.installationId || (req.body && req.body.installationId);

  if (!searchPhone) {
    return res.status(400).json({ error: 'Missing phone parameter' });
  }

  if (!installationId) {
    return res.status(401).json({
      error: 'Unauthenticated',
      message: 'Truecaller installationId is required. Provide Authorization Bearer or installationId parameter.'
    });
  }

  try {
    const cleanDigits = String(searchPhone).replace(/\D/g, '').slice(-10);
    const searchUrl = `https://search5-noneu.truecaller.com/v2/search?q=${cleanDigits}&countryCode=${searchCountry}&type=4&placement=SEARCHRESULTS,HISTORY,DETAILS&encoding=json`;

    const resp = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        'accept-encoding': 'gzip',
        'user-agent': 'Truecaller/11.75.5 (Android;10)',
        'Authorization': `Bearer ${installationId}`
      }
    });

    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
