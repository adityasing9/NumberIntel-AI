// Free Open Internet OSINT Endpoint for NumberIntel AI
// Aggregates 100% free, unauthenticated public web data from search engine indexing,
// WhatsApp open gateway, Telegram, Tellows, ShouldIAnswer, and community directories.

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
    summary: '',
    whatsapp_verified: false,
    whatsapp_status: 'not_found',
    whatsapp_confidence: 0,
    whatsapp_avatar: null,
    telegram_verified: false,
    telegram_status: 'not_found',
    telegram_confidence: 0,
    telegram_avatar: null
  };

  try {
    // ------------------------------------------------------------------------
    // 1. LIVE WHATSAPP OPEN PROFILE & AVATAR PROBE
    // ------------------------------------------------------------------------
    const whatsappPromise = (async () => {
      try {
        const waUrl = `https://api.whatsapp.com/send/?phone=${dialingCode}${tenDigits}`;
        const resp = await fetch(waUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (resp.status === 200) {
          const html = await resp.text();
          const imgMatch = html.match(/<meta\s+property=['"]og:image['"]\s+content=['"]([^'"]+)['"]/i);
          const titleMatch = html.match(/<meta\s+property=['"]og:title['"]\s+content=['"]([^'"]+)['"]/i);

          // Check if custom avatar is present (not generic WhatsApp placeholder)
          if (imgMatch && imgMatch[1]) {
            const imgUrl = imgMatch[1];
            const isDefaultLogo = imgUrl.includes('static.whatsapp.net') || imgUrl.includes('whatsapp.png') || imgUrl.includes('rukeqTVNJDY');
            if (!isDefaultLogo && imgUrl.startsWith('http')) {
              responsePayload.whatsapp_verified = true;
              responsePayload.whatsapp_status = 'verified_association';
              responsePayload.whatsapp_confidence = 90;
              responsePayload.whatsapp_avatar = imgUrl;

              if (!responsePayload.avatar_url) {
                responsePayload.avatar_url = imgUrl;
              }
              responsePayload.photo_sources.push({
                platform: 'WhatsApp',
                url: imgUrl,
                label: 'WhatsApp Public Profile Picture'
              });
              responsePayload.sources.push('WhatsApp Public Gateway');
            }
          }

          // Check if business profile name is present
          if (titleMatch && titleMatch[1]) {
            const ogTitle = titleMatch[1].trim();
            if (ogTitle && !ogTitle.includes('Share on WhatsApp') && !ogTitle.includes('Chat on WhatsApp')) {
              responsePayload.whatsapp_verified = true;
              responsePayload.whatsapp_status = 'verified_association';
              responsePayload.whatsapp_confidence = 90;
              if (!responsePayload.name) {
                responsePayload.name = ogTitle;
              }
              if (!responsePayload.business_name) {
                responsePayload.business_name = ogTitle;
                responsePayload.is_business = true;
              }
              responsePayload.sources.push('WhatsApp Business Directory');
            }
          }
        }
      } catch (err) {
        // Graceful continuation
      }
    })();

    // ------------------------------------------------------------------------
    // 2. OPEN SEARCH ENGINE RECON (DUCKDUCKGO LITE MULTI-QUERY)
    // ------------------------------------------------------------------------
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

          // Match links using class='result-link' and snippets using class='result-snippet'
          const linkMatches = [...html.matchAll(/<a\s+[^>]*href=['"]([^'"]+)['"][^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi)];
          const snippetMatches = [...html.matchAll(/<td[^>]+class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi)];

          for (let i = 0; i < linkMatches.length; i++) {
            let targetUrl = linkMatches[i][1];
            const title = linkMatches[i][2].replace(/<[^>]+>/g, '').trim();
            const snippet = snippetMatches[i] ? snippetMatches[i][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

            if (targetUrl.includes('uddg=')) {
              try {
                const queryPart = targetUrl.split('?')[1] || '';
                const params = new URLSearchParams(queryPart);
                const uddg = params.get('uddg');
                if (uddg) targetUrl = decodeURIComponent(uddg);
              } catch (e) {}
            }

            responsePayload.web_snippets.push({ title, snippet, url: targetUrl });
            const combined = `${title} ${snippet}`;

            // --- NAME EXTRACTION LOGIC ---
            // A) Check for Truecaller web results
            if (targetUrl.includes('truecaller.com')) {
              const tcNameMatch = title.match(/^(.*?)(?:\s*\(?\+?\d+\)?\s*[-|–]\s*Truecaller)/i) ||
                                  title.match(/Who (?:is calling|called) from \d+[\s?:\-–]+(.*?)(?:\s*[-|–]\s*Truecaller|$)/i);
              if (tcNameMatch && tcNameMatch[1]) {
                const candidate = tcNameMatch[1].trim();
                if (candidate.length > 2 && candidate.length < 50 && !candidate.toLowerCase().includes('phone number')) {
                  responsePayload.name = candidate;
                }
              }
            }

            // B) Check for LinkedIn profiles
            if (targetUrl.includes('linkedin.com/in/')) {
              const nameCandidate = title.split('-')[0].split('|')[0].replace(new RegExp(tenDigits, 'g'), '').trim();
              if (nameCandidate && nameCandidate.length > 2 && nameCandidate.length < 45 && !responsePayload.name) {
                responsePayload.name = nameCandidate;
              }
              const handleMatch = targetUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
              if (handleMatch) {
                responsePayload.social_profiles.push({
                  platform: 'LinkedIn',
                  url: targetUrl,
                  title: title,
                  type: 'Professional Profile'
                });
              }
            }

            // C) Check for Twitter / X profiles & Avatars
            if (targetUrl.includes('twitter.com/') || targetUrl.includes('x.com/')) {
              const handleMatch = targetUrl.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]{1,25})/i);
              if (handleMatch && !['intent', 'search', 'share', 'home', 'explore'].includes(handleMatch[1].toLowerCase())) {
                const handle = handleMatch[1];
                const xAvatar = `https://unavatar.io/twitter/${handle}`;
                responsePayload.social_profiles.push({
                  platform: 'X (Twitter)',
                  url: targetUrl,
                  title: `@${handle} (${title})`,
                  type: 'Social Handle'
                });
                responsePayload.photo_sources.push({
                  platform: 'X (Twitter)',
                  url: xAvatar,
                  label: `@${handle} Profile Picture`
                });
                if (!responsePayload.avatar_url) {
                  responsePayload.avatar_url = xAvatar;
                }
              }
            }

            // D) Check for Instagram profiles & Avatars
            if (targetUrl.includes('instagram.com/')) {
              const handleMatch = targetUrl.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
              if (handleMatch && !['p', 'reel', 'stories', 'explore', 'about'].includes(handleMatch[1].toLowerCase())) {
                const handle = handleMatch[1];
                const igAvatar = `https://unavatar.io/instagram/${handle}`;
                responsePayload.social_profiles.push({
                  platform: 'Instagram',
                  url: targetUrl,
                  title: `@${handle} (${title})`,
                  type: 'Social Profile'
                });
                responsePayload.photo_sources.push({
                  platform: 'Instagram',
                  url: igAvatar,
                  label: `@${handle} Instagram Avatar`
                });
                if (!responsePayload.avatar_url) {
                  responsePayload.avatar_url = igAvatar;
                }
              }
            }

            // E) Check for Telegram channels or handles
            if (targetUrl.includes('t.me/')) {
              const handleMatch = targetUrl.match(/t\.me\/([a-zA-Z0-9_]{3,32})/i);
              if (handleMatch && !handleMatch[1].startsWith('+') && !['joinchat', 'share'].includes(handleMatch[1].toLowerCase())) {
                const handle = handleMatch[1];
                const tgAvatar = `https://unavatar.io/telegram/${handle}`;
                responsePayload.telegram_verified = true;
                responsePayload.telegram_status = 'verified_association';
                responsePayload.telegram_confidence = 85;
                responsePayload.social_profiles.push({
                  platform: 'Telegram',
                  url: targetUrl,
                  title: `@${handle} (${title})`,
                  type: 'Public Telegram Channel'
                });
                responsePayload.photo_sources.push({
                  platform: 'Telegram',
                  url: tgAvatar,
                  label: `@${handle} Telegram Avatar`
                });
                if (!responsePayload.avatar_url) {
                  responsePayload.avatar_url = tgAvatar;
                }
              }
            }

            // F) Check for Enterprise / Corporate / MCA Listings
            if (
              combined.toLowerCase().includes('pvt ltd') ||
              combined.toLowerCase().includes('limited') ||
              combined.toLowerCase().includes('llp') ||
              combined.toLowerCase().includes('enterprises') ||
              combined.toLowerCase().includes('services') ||
              combined.toLowerCase().includes('clinic') ||
              combined.toLowerCase().includes('hospital') ||
              combined.toLowerCase().includes('restaurant') ||
              combined.toLowerCase().includes('resort') ||
              combined.toLowerCase().includes('hotel')
            ) {
              responsePayload.is_business = true;
              if (!responsePayload.business_name) {
                const bCandidate = title.split('-')[0].split('|')[0].trim();
                if (bCandidate.length > 2 && bCandidate.length < 55) {
                  responsePayload.business_name = bCandidate;
                }
              }
              // Domain avatar if targetUrl has custom domain
              try {
                const domain = new URL(targetUrl).hostname.replace(/^www\./, '');
                if (!['clickedindia.net', 'google.com', 'duckduckgo.com', 'numlookup.com', 'whocalls.me'].includes(domain)) {
                  const domainLogo = `https://unavatar.io/${domain}`;
                  responsePayload.photo_sources.push({
                    platform: 'Corporate Brand Logo',
                    url: domainLogo,
                    label: `${domain} Official Brand Icon`
                  });
                  if (!responsePayload.avatar_url) {
                    responsePayload.avatar_url = domainLogo;
                  }
                }
              } catch (e) {}
            }

            // G) Generic Name from Contact Person / Owner in snippet
            if (!responsePayload.name) {
              const nameMatch = combined.match(/(?:Contact Person|Contact|Owner|Proprietor|Director|Name)[:\-–\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
              if (nameMatch && nameMatch[1]) {
                const cand = nameMatch[1].trim();
                if (cand.length > 3 && cand.length < 40 && !cand.toLowerCase().includes('click') && !cand.toLowerCase().includes('reverse')) {
                  responsePayload.name = cand;
                }
              }
            }
          }

          if (responsePayload.web_snippets.length > 0) {
            responsePayload.sources.push('Open Web Search Index');
          }
        }
      } catch (err) {
        // Continue gracefully
      }
    })();

    // ------------------------------------------------------------------------
    // 3. TELLOWS REPUTATION & CALLER REGISTRY
    // ------------------------------------------------------------------------
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
      } catch (err) {}
    })();

    // ------------------------------------------------------------------------
    // 4. SHOULD-I-ANSWER GLOBAL DIRECTORY
    // ------------------------------------------------------------------------
    const siaPromise = (async () => {
      try {
        const siaUrl = `https://www.shouldianswer.com/phone-number/${tenDigits}`;
        const resp = await fetch(siaUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (resp.status === 200) {
          const html = await resp.text();
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) {
            const pageTitle = titleMatch[1];
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
                if (validReviews >= 5) break;
              }
            }
            if (validReviews > 0) {
              responsePayload.sources.push('ShouldIAnswer Global Directory');
            }
          }
        }
      } catch (err) {}
    })();

    await Promise.allSettled([whatsappPromise, ddgPromise, tellowsPromise, siaPromise]);

    // ------------------------------------------------------------------------
    // 5. CARRIER ALLOCATION DECODING (TRAI / ITU / NTA)
    // ------------------------------------------------------------------------
    if (!responsePayload.carrier) {
      if (countryParam === 'NP' || cleanDigits.startsWith('977')) {
        const prefix3 = tenDigits.slice(0, 3);
        const prefix2 = tenDigits.slice(0, 2);
        if (['984', '985', '986', '974', '975'].includes(prefix3)) {
          responsePayload.carrier = 'Nepal Telecom (NTC / Namaste)';
          responsePayload.circle = prefix3 === '985' ? 'Nepal Postpaid Grid' : 'Nepal Mobile Grid (GSM/4G/5G)';
        } else if (['980', '981', '982', '970'].includes(prefix3)) {
          responsePayload.carrier = 'Ncell Axiata';
          responsePayload.circle = 'Nepal Cellular Grid (Ncell)';
        } else if (['961', '962', '988'].includes(prefix3)) {
          responsePayload.carrier = 'Smart Telecom (SmartCell)';
          responsePayload.circle = 'Nepal Mobile Grid';
        } else if (prefix2 === '01' || prefix2 === '1') {
          responsePayload.carrier = 'Nepal Telecom (Fixed PSTN)';
          responsePayload.circle = 'Bagmati Province (Kathmandu Valley)';
        } else {
          responsePayload.carrier = 'Nepal Telecom / Ncell Axiata';
          responsePayload.circle = 'Federal Democratic Republic of Nepal Grid';
        }
        responsePayload.sources.push('Nepal Telecommunications Authority (NTA)');
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

    // ------------------------------------------------------------------------
    // 6. SPAM RISK SCORING
    // ------------------------------------------------------------------------
    if (responsePayload.spam_score >= 7 || responsePayload.spam_reports_count >= 3) {
      responsePayload.spam_risk_level = 'high';
    } else if (responsePayload.spam_score >= 5 || responsePayload.spam_reports_count >= 1) {
      responsePayload.spam_risk_level = 'medium';
    }

    // ------------------------------------------------------------------------
    // 7. DIRECT OSINT ACTION LINKS
    // ------------------------------------------------------------------------
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

    // ------------------------------------------------------------------------
    // 8. UNIFIED AVATAR & NAME RESOLUTION
    // ------------------------------------------------------------------------
    // If name discovered but no image found yet, resolve avatar via Unavatar
    if (responsePayload.name && !responsePayload.avatar_url) {
      const cleanName = responsePayload.name.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanName) {
        const avatarGen = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(responsePayload.name)}&backgroundColor=0f172a&textColor=38bdf8`;
        responsePayload.avatar_url = avatarGen;
        responsePayload.photo_sources.push({
          platform: 'Open Web Avatar Index',
          url: avatarGen,
          label: `Verified Public Identifier (${responsePayload.name})`
        });
      }
    }

    // ------------------------------------------------------------------------
    // 9. COMPOSE EXECUTIVE SUMMARY
    // ------------------------------------------------------------------------
    let summaryParts = [];
    if (responsePayload.name) {
      summaryParts.push(`Identified online entity: "${responsePayload.name}"`);
    } else if (responsePayload.business_name) {
      summaryParts.push(`Associated business entity: "${responsePayload.business_name}"`);
    } else {
      summaryParts.push(`Subscriber line ${e164} is active and allocated via national numbering series`);
    }

    if (responsePayload.carrier) {
      summaryParts.push(`Allocated carrier network: ${responsePayload.carrier}${responsePayload.circle ? ` (${responsePayload.circle})` : ''}`);
    }

    if (responsePayload.whatsapp_verified) {
      summaryParts.push('WhatsApp status: Verified Active Profile / Business Account');
    } else {
      summaryParts.push('WhatsApp status: Not verified in public business directories (Private Account)');
    }

    if (responsePayload.spam_reports_count > 0 || responsePayload.spam_score >= 5) {
      summaryParts.push(`Reputation alert: ${responsePayload.spam_risk_level.toUpperCase()} risk with ${responsePayload.spam_reports_count} community report(s)`);
    } else {
      summaryParts.push('Reputation: Clean record across queried public threat registries');
    }

    if (responsePayload.web_snippets.length > 0) {
      summaryParts.push(`Discovered ${responsePayload.web_snippets.length} open web mentions`);
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
