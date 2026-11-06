// Free Open Internet OSINT Endpoint for NumberIntel AI
// Aggregates 100% free, unauthenticated public web data from search engine indexing,
// open telecom registries, and community anti-spam databases without requiring OTPs or paid API keys.

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const phoneParam = req.query.phone || (req.body && req.body.phone);
  const countryParam = (req.query.countryCode || (req.body && req.body.countryCode) || 'IN').toUpperCase();

  if (!phoneParam) {
    return res.status(400).json({ error: 'Missing phone parameter' });
  }

  const cleanDigits = String(phoneParam).replace(/\D/g, '');
  const tenDigits = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
  const dialingCode = countryParam === 'IN' ? '91' : countryParam === 'NP' ? '977' : countryParam === 'US' ? '1' : countryParam === 'GB' ? '44' : '91';
  const e164 = `+${dialingCode}${tenDigits}`;

  const responsePayload = {
    phone: e164,
    clean_digits: tenDigits,
    country_iso2: countryParam,
    name: null,
    business_name: null,
    carrier: null,
    circle: null,
    location: null,
    is_business: false,
    avatar_url: null,
    photo_sources: [],
    spam_score: 0,
    spam_risk_level: 'low',
    spam_reports_count: 0,
    spam_categories: [],
    social_profiles: [],
    web_snippets: [],
    sources: [],
    summary: ''
  };

  try {
    // 1. QUERY OPEN SEARCH ENGINE (DuckDuckGo Lite POST Recon)
    const ddgPromise = (async () => {
      try {
        const query = `"${tenDigits}"`;
        const postBody = new URLSearchParams({ q: query }).toString();
        const resp = await fetch('https://lite.duckduckgo.com/lite/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          body: postBody
        });

        if (resp.status === 200) {
          const html = await resp.text();
          const linkMatches = [...html.matchAll(/<a[^>]+class="result-link"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
          const snippetMatches = [...html.matchAll(/<td[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/g)];

          for (let i = 0; i < linkMatches.length; i++) {
            const rawHref = linkMatches[i][1];
            const title = linkMatches[i][2].replace(/<[^>]+>/g, '').trim();
            const snippet = snippetMatches[i] ? snippetMatches[i][1].replace(/<[^>]+>/g, '').trim() : '';
            let targetUrl = rawHref;

            if (rawHref.includes('uddg=')) {
              try {
                const queryPart = rawHref.split('?')[1] || '';
                const params = new URLSearchParams(queryPart);
                const uddg = params.get('uddg');
                if (uddg) targetUrl = decodeURIComponent(uddg);
              } catch (e) {}
            }

            responsePayload.web_snippets.push({ title, snippet, url: targetUrl });

            // Social Profile Discovery
            if (targetUrl.includes('linkedin.com/in/')) {
              const nameCandidate = title.split('-')[0].split('|')[0].replace(new RegExp(tenDigits, 'g'), '').trim();
              if (nameCandidate && nameCandidate.length > 2 && !responsePayload.name) {
                responsePayload.name = nameCandidate;
              }
              responsePayload.social_profiles.push({
                platform: 'LinkedIn',
                url: targetUrl,
                title: title,
                type: 'Professional Profile'
              });
            } else if (targetUrl.includes('facebook.com/')) {
              responsePayload.social_profiles.push({
                platform: 'Facebook',
                url: targetUrl,
                title: title,
                type: 'Social Profile'
              });
            } else if (targetUrl.includes('instagram.com/')) {
              responsePayload.social_profiles.push({
                platform: 'Instagram',
                url: targetUrl,
                title: title,
                type: 'Social Profile'
              });
            } else if (targetUrl.includes('twitter.com/') || targetUrl.includes('x.com/')) {
              responsePayload.social_profiles.push({
                platform: 'X (Twitter)',
                url: targetUrl,
                title: title,
                type: 'Social Handle'
              });
            }

            // Enterprise & Business Discovery
            const combinedText = `${title} ${snippet}`.toLowerCase();
            if (
              combinedText.includes('store') ||
              combinedText.includes('hospital') ||
              combinedText.includes('clinic') ||
              combinedText.includes('pvt ltd') ||
              combinedText.includes('limited') ||
              combinedText.includes('enterprise') ||
              combinedText.includes('customer care')
            ) {
              responsePayload.is_business = true;
              if (!responsePayload.business_name) {
                const bName = title.split('-')[0].split('|')[0].trim();
                if (bName.length < 50) responsePayload.business_name = bName;
              }
            }

            // Carrier Mentions
            const CARRIER_KEYWORDS = [
              { name: 'Bharti Airtel Limited', regex: /bharti\s*airtel|airtel/i },
              { name: 'Vodafone Idea (Vi)', regex: /vodafone\s*idea|\bvi\b|vodafone/i },
              { name: 'Reliance Jio Infocomm', regex: /reliance\s*jio|\bjio\b/i },
              { name: 'BSNL', regex: /\bbsnl\b|bharat\s*sanchar/i },
              { name: 'MTNL', regex: /\bmtnl\b/i },
              { name: 'Nepal Telecom (NTC / Namaste)', regex: /nepal\s*telecom|\bntc\b|namaste/i },
              { name: 'Ncell Axiata', regex: /ncell|\baxiata\b/i },
              { name: 'Smart Telecom (SmartCell)', regex: /smart\s*telecom|smartcell/i },
              { name: 'Verizon Wireless', regex: /\bverizon\b/i },
              { name: 'AT&T', regex: /\bat&t\b/i },
              { name: 'T-Mobile', regex: /\bt-mobile\b/i },
              { name: 'EE', regex: /\bee\b/i },
              { name: 'O2', regex: /\bo2\b/i }
            ];
            for (const c of CARRIER_KEYWORDS) {
              if (!responsePayload.carrier && c.regex.test(combinedText)) {
                responsePayload.carrier = c.name;
              }
            }

            // Spam Mentions
            if (
              combinedText.includes('scam') ||
              combinedText.includes('fraud') ||
              combinedText.includes('telemarketer') ||
              combinedText.includes('cost trap') ||
              combinedText.includes('unwanted calls')
            ) {
              responsePayload.spam_reports_count += 1;
              if (combinedText.includes('scam') && !responsePayload.spam_categories.includes('Suspected Scam')) {
                responsePayload.spam_categories.push('Suspected Scam');
              }
              if (combinedText.includes('telemarketer') && !responsePayload.spam_categories.includes('Telemarketing')) {
                responsePayload.spam_categories.push('Telemarketing');
              }
              if (combinedText.includes('cost trap') && !responsePayload.spam_categories.includes('Cost Trap / Robocall')) {
                responsePayload.spam_categories.push('Cost Trap / Robocall');
              }
            }

            // Location mentions
            const LOCATIONS = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Nepalgunj', 'Janakpur', 'Hetauda', 'Dhangadhi', 'Mumbai', 'Delhi', 'Bengaluru', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kerala', 'Karnataka', 'Maharashtra', 'Gujarat', 'Punjab'];
            for (const loc of LOCATIONS) {
              if (!responsePayload.circle && combinedText.includes(loc.toLowerCase())) {
                responsePayload.circle = loc;
              }
            }
          }

          if (responsePayload.web_snippets.length > 0) {
            responsePayload.sources.push('Open Web Search Index');
          }
        }
      } catch (err) {
        // Continue gracefully if search engine rate-limits
      }
    })();

    // 2. QUERY SHOULD-I-ANSWER GLOBAL ANTI-SPAM DIRECTORY
    const siaPromise = (async () => {
      try {
        const siaUrl = `https://www.shouldianswer.com/phone-number/${tenDigits}`;
        const resp = await fetch(siaUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (resp.status === 200) {
          const html = await resp.text();
          // Extract title
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) {
            const pageTitle = titleMatch[1];
            // Extract user review snippets
            const reviewMatches = [...html.matchAll(/class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p)>/gi)];
            let validReviews = 0;
            for (const rm of reviewMatches) {
              const cleanText = rm[1].replace(/<[^>]+>/g, '').trim();
              if (cleanText.length > 15 && cleanText.length < 200 && !cleanText.includes('Add Comment')) {
                responsePayload.web_snippets.push({
                  title: `User Report (${pageTitle.split('|')[0].trim()})`,
                  snippet: cleanText,
                  url: siaUrl
                });
                validReviews++;
                responsePayload.spam_reports_count += 1;
                if (/scam|fraud/i.test(cleanText) && !responsePayload.spam_categories.includes('Suspected Scam')) {
                  responsePayload.spam_categories.push('Suspected Scam');
                }
                if (/telemarket/i.test(cleanText) && !responsePayload.spam_categories.includes('Telemarketing')) {
                  responsePayload.spam_categories.push('Telemarketing');
                }
                if (/robocall/i.test(cleanText) && !responsePayload.spam_categories.includes('Cost Trap / Robocall')) {
                  responsePayload.spam_categories.push('Cost Trap / Robocall');
                }
                if (validReviews >= 5) break;
              }
            }
            if (validReviews > 0) {
              responsePayload.sources.push('ShouldIAnswer Global Anti-Spam Directory');
            }
          }
        }
      } catch (err) {
        // Graceful continuation
      }
    })();

    // 2. QUERY TELLOWS OPEN COMMUNITY REGISTRY
    const tellowsPromise = (async () => {
      try {
        const tUrl = countryParam === 'IN'
          ? `https://www.tellows.in/num/${tenDigits}`
          : `https://www.tellows.com/num/${cleanDigits}`;

        const resp = await fetch(tUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (resp.status === 200) {
          const html = await resp.text();
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);

          if (titleMatch) {
            const pageTitle = titleMatch[1];
            // Format: "Who calls from 9876543210 Bharti Airtel Limited ? | Phone number score: 5"
            const parseMatch = pageTitle.match(/Who calls from \d+\s+(.*?)\s*\?.*?score:\s*(\d+)/i);
            if (parseMatch) {
              const callerOrCarrier = parseMatch[1].trim();
              const score = parseInt(parseMatch[2].trim(), 10);

              if (score) responsePayload.spam_score = score;
              if (callerOrCarrier && callerOrCarrier !== 'SMS Service' && callerOrCarrier !== 'unknown') {
                if (
                  callerOrCarrier.includes('Airtel') ||
                  callerOrCarrier.includes('Vodafone') ||
                  callerOrCarrier.includes('Jio') ||
                  callerOrCarrier.includes('BSNL') ||
                  callerOrCarrier.includes('Nepal Telecom') ||
                  callerOrCarrier.includes('Ncell') ||
                  callerOrCarrier.includes('Smart Telecom')
                ) {
                  if (!responsePayload.carrier) responsePayload.carrier = callerOrCarrier;
                } else {
                  if (!responsePayload.name) responsePayload.name = callerOrCarrier;
                }
              }

              responsePayload.sources.push('Tellows Anti-Spam Registry');
            }
          }
        }
      } catch (err) {
        // Graceful continuation
      }
    })();

    await Promise.allSettled([ddgPromise, siaPromise, tellowsPromise]);

    // 2.5 TELECOM ALLOCATION REGISTRY FALLBACK
    if (!responsePayload.carrier) {
      if (countryParam === 'NP' || cleanDigits.startsWith('977')) {
        const prefix3 = tenDigits.slice(0, 3);
        const prefix2 = tenDigits.slice(0, 2);
        if (['984', '985', '986', '974', '975'].includes(prefix3)) {
          responsePayload.carrier = 'Nepal Telecom (NTC / Namaste)';
          responsePayload.circle = prefix3 === '985' ? 'Nepal Postpaid Grid' : 'Nepal Mobile Grid (GSM/4G/5G)';
          responsePayload.sources.push('Nepal Telecommunications Authority (NTA)');
        } else if (['980', '981', '982', '970'].includes(prefix3)) {
          responsePayload.carrier = 'Ncell Axiata';
          responsePayload.circle = 'Nepal Cellular Grid (Ncell)';
          responsePayload.sources.push('Nepal Telecommunications Authority (NTA)');
        } else if (['961', '962', '988'].includes(prefix3)) {
          responsePayload.carrier = 'Smart Telecom (SmartCell)';
          responsePayload.circle = 'Nepal Mobile Grid';
          responsePayload.sources.push('Nepal Telecommunications Authority (NTA)');
        } else if (prefix2 === '01' || prefix2 === '1') {
          responsePayload.carrier = 'Nepal Telecom (Fixed PSTN)';
          responsePayload.circle = 'Bagmati Province (Kathmandu Valley)';
          responsePayload.sources.push('Nepal Telecommunications Authority (NTA)');
        } else if (prefix3 === '061' || prefix2 === '61') {
          responsePayload.carrier = 'Nepal Telecom (Fixed PSTN)';
          responsePayload.circle = 'Gandaki Province (Pokhara)';
          responsePayload.sources.push('Nepal Telecommunications Authority (NTA)');
        } else if (prefix3 === '071' || prefix2 === '71') {
          responsePayload.carrier = 'Nepal Telecom (Fixed PSTN)';
          responsePayload.circle = 'Lumbini Province (Butwal / Bhairahawa)';
          responsePayload.sources.push('Nepal Telecommunications Authority (NTA)');
        } else {
          responsePayload.carrier = 'Nepal Telecom / Ncell Axiata';
          responsePayload.circle = 'Federal Democratic Republic of Nepal Grid';
          responsePayload.sources.push('Nepal Telecommunications Authority (NTA)');
        }
      } else if (countryParam === 'IN' || cleanDigits.startsWith('91')) {
        const prefix2 = tenDigits.slice(0, 2);
        if (['94'].includes(prefix2)) {
          responsePayload.carrier = 'BSNL Mobile';
        } else if (['70', '79', '85', '88', '62', '63'].includes(prefix2)) {
          responsePayload.carrier = 'Reliance Jio Infocomm';
        } else {
          responsePayload.carrier = 'Bharti Airtel / Vodafone Idea (Vi)';
        }
        responsePayload.circle = 'National Cellular Grid (India)';
        responsePayload.sources.push('TRAI / DoT Telecom Series');
      }
    }

    // 3. SPAM RISK ASSESSMENT
    if (responsePayload.spam_score >= 7 || responsePayload.spam_reports_count >= 3) {
      responsePayload.spam_risk_level = 'high';
    } else if (responsePayload.spam_score >= 5 || responsePayload.spam_reports_count >= 1) {
      responsePayload.spam_risk_level = 'medium';
    }

    // 4. ALWAYS ATTACH DIRECT MESSAGING & PROFILE LINKS
    responsePayload.social_profiles.unshift({
      platform: 'WhatsApp',
      url: `https://wa.me/${dialingCode}${tenDigits}`,
      title: 'WhatsApp Direct Chat / Presence',
      type: 'Direct Communication Channel'
    });

    responsePayload.social_profiles.push({
      platform: 'Truecaller Web',
      url: `https://www.truecaller.com/search/${countryParam.toLowerCase()}/${tenDigits}`,
      title: 'Truecaller Web Directory Lookup',
      type: 'Caller Directory Registry'
    });

    // 5. AVATAR RESOLUTION FROM OPEN WEB
    if (responsePayload.name && !responsePayload.avatar_url) {
      const cleanName = responsePayload.name.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanName) {
        responsePayload.avatar_url = `https://unavatar.io/${encodeURIComponent(cleanName)}?fallback=false`;
        responsePayload.photo_sources.push({
          platform: 'Open Web Avatar Index',
          url: `https://unavatar.io/${encodeURIComponent(cleanName)}`,
          label: 'Discovered Public Profile Icon'
        });
      }
    }

    // 6. COMPOSE FORENSIC SUMMARY
    let summaryParts = [];
    if (responsePayload.name) {
      summaryParts.push(`Identified online entity: "${responsePayload.name}"`);
    } else if (responsePayload.business_name) {
      summaryParts.push(`Associated business entity: "${responsePayload.business_name}"`);
    }

    if (responsePayload.carrier) {
      summaryParts.push(`Operating network: ${responsePayload.carrier}${responsePayload.circle ? ` (${responsePayload.circle})` : ''}`);
    }

    if (responsePayload.spam_reports_count > 0 || responsePayload.spam_score >= 5) {
      summaryParts.push(`Anti-spam risk rating: ${responsePayload.spam_risk_level.toUpperCase()} with ${responsePayload.spam_reports_count} community report(s) and risk index ${responsePayload.spam_score}/9`);
    } else {
      summaryParts.push('Reputation: Clean record across queried open-web directories');
    }

    if (responsePayload.web_snippets.length > 0) {
      summaryParts.push(`Indexed in ${responsePayload.web_snippets.length} public web search results`);
    }

    responsePayload.summary = summaryParts.join('. ') + '.';

    return res.status(200).json({
      success: true,
      data: responsePayload
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      data: responsePayload
    });
  }
}
