/**
 * AI Presentation Generator Service
 */

export function generatePresentationData({ userInput, prompt, topic, slideCount = 10, audience = 'General', tone = 'Professional', language = 'English', presetId = 'biz-exec-brief' }) {
  const rawInput = (userInput || prompt || topic || '').trim();

  if (!rawInput) {
    throw new Error('Presentation content generation failed: User input / presentation topic is required.');
  }

  // 0. Sanitize Input
  const sanitizeInputText = (raw) => {
    if (!raw) return '';
    const lines = raw.split(/\r?\n/);
    const cleaned = [];
    let skippingDesign = false;
    for (const l of lines) {
      const t = l.trim();
      if (/^[-=_*]{3,}$/.test(t)) continue;
      if (/^(?:DESIGN\s+REQUIREMENTS|Design\s+&\s+Generation\s+Instructions|IMPORTANT\s+BEHAVIOR\s+RULE|Visual\s+direction|PRIMARY\s+FIX|Design\s+rules)/i.test(t)) {
        skippingDesign = true;
        continue;
      }
      if (skippingDesign) {
        if (/^(?:#{1,3}\s+|\d+[\.\)]\s+|[A-Z0-9\s]{3,30}:)/i.test(t) && !/^(?:Do\s+NOT|Maintain|Avoid|Use|Choose|Every|The\s+final|Most\s+importantly)/i.test(t)) {
          skippingDesign = false;
        } else {
          continue;
        }
      }
      if (/^(?:Do\s+NOT\s+|Don't\s+|Never\s+|Avoid:|Maintain:|Most\s+importantly:|Please\s+generate|Create\s+a\s+(?:premium|modern)?\s*presentation)/i.test(t)) continue;
      const cleanLine = t
        .replace(/^(?:Visual(?:\s+idea)?|Possible\s+visual|Key\s+idea|Key\s+message|Opening\s+message|Important\s+limitation|Final\s+message)\s*:\s*/i, '')
        .replace(/^[—–-]\s+/, '')
        .trim();
      if (cleanLine.length > 0) cleaned.push(cleanLine);
    }
    return cleaned.join('\n');
  };

  const sanitized = sanitizeInputText(rawInput);
  const cleanInput = (sanitized || rawInput).trim();

  // 1. Extract Presentation Title
  let mainTitle = '';
  const h1Match = cleanInput.match(/^#\s+([^\n\r]+)/m);
  if (h1Match && h1Match[1].trim().length > 2 && !/^(?:TITLE|Slide\s+\d+|Section\s+\d+)$/i.test(h1Match[1].trim())) {
    mainTitle = h1Match[1].trim();
  } else {
    const explicitTitleMatch = cleanInput.match(/\b(?:presentation\s+title|deck\s+title|title)\s*[:=]\s*["“']?([^"”'\n\r]+)["”']?/i);
    if (explicitTitleMatch && explicitTitleMatch[1].trim().length > 2 && !/^(?:TITLE|Slide\s+\d+|Section\s+\d+)$/i.test(explicitTitleMatch[1].trim())) {
      mainTitle = explicitTitleMatch[1].trim();
    } else {
      const aboutMatch = cleanInput.match(/\b(?:presentation\s+(?:on|about)|create\s+a\s+(?:\d+[- ]slide\s+)?presentation\s+(?:on|about)|slides\s+(?:on|about))\s+["“']?([^"”'\n\r\.]+?)["”']?(?:\s+for|\.|\n|$)/i);
      if (aboutMatch && aboutMatch[1].trim().length > 2) {
        mainTitle = aboutMatch[1].trim();
      } else {
        const firstLine = cleanInput.split('\n')[0].replace(/^[#*-—–\s\d\.\)]*/, '').replace(/^Create\s+(?:a\s+)?(?:\d+[- ]slide\s+)?presentation\s+(?:on|about)?\s*/i, '').trim();
        mainTitle = firstLine.length > 3 && firstLine.length < 80 && !/^(?:TITLE|Slide|Section)$/i.test(firstLine) ? firstLine : 'AI-Powered Strategic Overview';
      }
    }
  }
  mainTitle = mainTitle.replace(/^["'“‘\s\-—–:•*#]+|["'”’\s\-—–:•*]+$/g, '').trim();

  // 2. Extract Audience if specified
  let effectiveAudience = audience;
  const audienceMatch = cleanInput.match(/Audience:\s*([^\n\r]+)/i);
  if (audienceMatch && audienceMatch[1].trim().length > 2) {
    effectiveAudience = audienceMatch[1].trim();
  }

  // 3. Extract requested slide count if present
  let effectiveCount = parseInt(slideCount, 10) || 10;
  const countMatch = cleanInput.match(/(\d+)\s*[- ]\s*slide/i);
  if (countMatch && parseInt(countMatch[1], 10) >= 3 && parseInt(countMatch[1], 10) <= 30) {
    effectiveCount = parseInt(countMatch[1], 10);
  }

  const deriveActionTag = (text, index) => {
    const lower = text.toLowerCase();
    if (lower.includes('detect') || lower.includes('vision') || lower.includes('sensor') || lower.includes('telemetry') || lower.includes('imaging') || lower.includes('scan') || lower.includes('monitor') || lower.includes('camera') || lower.includes('flag')) return 'DETECT';
    if (lower.includes('diagnos') || lower.includes('analyz') || lower.includes('evaluat') || lower.includes('insight') || lower.includes('pathology') || lower.includes('radiology') || lower.includes('pattern')) return 'ANALYZE';
    if (lower.includes('personaliz') || lower.includes('tailor') || lower.includes('genom') || lower.includes('custom') || lower.includes('adapt') || lower.includes('individual') || lower.includes('precision')) return 'PERSONALIZE';
    if (lower.includes('automat') || lower.includes('scribe') || lower.includes('draft') || lower.includes('extract') || lower.includes('nlp') || lower.includes('transcript') || lower.includes('assistant')) return 'AUTOMATE';
    if (lower.includes('optimiz') || lower.includes('schedul') || lower.includes('throughput') || lower.includes('logistics') || lower.includes('bed management') || lower.includes('supply chain') || lower.includes('energy')) return 'OPTIMIZE';
    if (lower.includes('protect') || lower.includes('privacy') || lower.includes('hipaa') || lower.includes('encrypt') || lower.includes('security') || lower.includes('safeguard')) return 'SECURE';
    if (lower.includes('govern') || lower.includes('audit') || lower.includes('fairness') || lower.includes('compliance') || lower.includes('oversight') || lower.includes('physician') || lower.includes('ethic')) return 'GOVERN';
    if (lower.includes('treatment') || lower.includes('therap') || lower.includes('clinical') || lower.includes('patient') || lower.includes('care') || lower.includes('prescri') || lower.includes('deliver')) return 'DELIVER';
    if (lower.includes('connect') || lower.includes('network') || lower.includes('integrat') || lower.includes('decentraliz') || lower.includes('ecosystem')) return 'CONNECT';
    if (lower.includes('predict') || lower.includes('forecast') || lower.includes('early') || lower.includes('prevent')) return 'PREDICT';
    if (lower.includes('create') || lower.includes('generate') || lower.includes('quiz') || lower.includes('lesson')) return 'CREATE';
    const defaultTags = ['CORE', 'SYSTEM', 'PROCESS', 'IMPACT'];
    return defaultTags[index % defaultTags.length];
  };

  const extractSubstantiveCardTitle = (sentence, index) => {
    const clean = sentence
      .replace(/^[\s\d\.\-\*•—–\(\)\[\]#]+/, '')
      .replace(/^(?:such as|such|that|as well as|e\.g\.|i\.e\.|for example|namely|including)\s*[:\-—]?\s*/i, '')
      .trim();
    if (!clean) return { title: 'Strategic Focus', highlight: 'CORE' };

    if (clean.includes(':')) {
      const parts = clean.split(':');
      const header = parts[0].replace(/^[\s\d\.\-\*•—–#]+/, '').trim();
      if (header.length >= 3 && header.length <= 40) {
        return {
          title: header.charAt(0).toUpperCase() + header.slice(1),
          highlight: deriveActionTag(clean, index)
        };
      }
    }

    const clause = clean.split(/[,;\.]|\b(?:to\s+|which\s+|that\s+|in\s+order\s+to\s+|by\s+|helping\s+|enabling\s+)/i)[0].trim();
    const words = clause.split(/\s+/).filter(w => !/^(?:a|an|the|this|that|these|those|our|all|some|many|each|every|can|will|is|are|was|were)$/i.test(w));
    let candidateTitle = '';
    if (words.length >= 2 && words.length <= 6) {
      candidateTitle = words.join(' ');
    } else if (words.length > 6) {
      candidateTitle = words.slice(0, 4).join(' ');
    } else {
      const allWords = clean.split(/\s+/).filter(w => !/^(?:a|an|the|is|are|was|were|can|will|should|could|must)$/i.test(w));
      candidateTitle = allWords.slice(0, Math.min(allWords.length, 4)).join(' ');
    }

    candidateTitle = candidateTitle
      .replace(/[^a-zA-Z0-9\s&/'-]/g, '')
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      title: candidateTitle || `Focus Area 0${index + 1}`,
      highlight: deriveActionTag(clean, index)
    };
  };

  const craftActiveHeadline = (categoryOrTopic, mainIdea) => {
    const cleanCat = categoryOrTopic
      .replace(/^[\s\d\.\-\*•—–#]+/, '')
      .replace(/^["'“‘]+|["'”’]+$/g, '')
      .replace(/^(?:Slide|Section|Topic|Chapter)\s+\d+[:\.\-]?\s*/i, '')
      .trim();
    if (!cleanCat) return 'Strategic Priority & Core Capabilities';
    if (cleanCat.length >= 15 && !cleanCat.toLowerCase().startsWith('section') && !cleanCat.toLowerCase().startsWith('slide')) {
      return cleanCat;
    }
    if (mainIdea && mainIdea.length > 15 && mainIdea.length < 80) {
      const cleanIdea = mainIdea.replace(/^[\s\d\.\-\*•—–#]+/, '').replace(/\.$/, '').trim();
      return `${cleanCat}: ${cleanIdea}`;
    }
    return `${cleanCat}: Strategic Principles & Key Capabilities`;
  };

  // 4. Extract Structured Sections
  const rawSections = [];
  const sectionBlockRegex = /(?:^|\n)\s*(?:(\d+)[\.\)]\s+|\b(?:Slide|Section|Topic|Chapter)\s+(\d+)[:\.\-]?\s+|#{1,4}\s+)([^\n\r]+)\r?\n([\s\S]*?)(?=(?:\r?\n\s*(?:\d+[\.\)]|\b(?:Slide|Section|Topic|Chapter)\s+\d+|#{1,4}\s+))|$)/gi;

  let blockMatch;
  while ((blockMatch = sectionBlockRegex.exec(cleanInput)) !== null) {
    const num = blockMatch[1] ? parseInt(blockMatch[1], 10) : (blockMatch[2] ? parseInt(blockMatch[2], 10) : undefined);
    const secTitle = blockMatch[3].trim().replace(/^["'“‘\s\-—–:•*#\d\.\)]+|["'”’\s\-—–:•*]+$/g, '');
    const secBody = blockMatch[4].trim();
    if (secTitle.length > 1 && !/^(?:TITLE|Slide|Section|Design\s+Requirements)$/i.test(secTitle)) {
      rawSections.push({ num, title: secTitle, body: secBody });
    }
  }

  if (rawSections.length === 0) {
    const lines = cleanInput.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let currentTitle = '';
    let currentBodyLines = [];

    for (const line of lines) {
      if (/^[-*•—–]\s+/.test(line)) {
        const itemText = line.replace(/^[-*•—–]\s+/, '').trim();
        rawSections.push({ title: itemText.substring(0, 45), body: itemText });
      } else if (line.length < 60 && !line.endsWith('.') && !/^(?:TITLE|Slide|Section)$/i.test(line)) {
        if (currentTitle) {
          rawSections.push({ title: currentTitle, body: currentBodyLines.join(' ') });
          currentBodyLines = [];
        }
        currentTitle = line.replace(/^["'“‘\s\-—–:•*#\d\.\)]+|["'”’\s\-—–:•*]+$/g, '');
      } else {
        currentBodyLines.push(line);
      }
    }
    if (currentTitle) {
      rawSections.push({ title: currentTitle, body: currentBodyLines.join(' ') });
    }
  }

  // Build slides array
  const slides = [];

  // Slide 1: Hero Overview
  slides.push({
    id: `slide-1-${Date.now()}`,
    slideNumber: 1,
    title: `${mainTitle}: Strategic Overview & Key Concepts`,
    subtitle: `A comprehensive presentation for ${effectiveAudience}`,
    layout: 'hero',
    content: {
      headline: `${mainTitle}: Strategic Overview & Key Concepts`,
      bullets: rawSections.slice(0, 3).map(s => s.title),
      cards: [
        { title: 'Audience Focus', desc: effectiveAudience, highlight: 'AUDIENCE', iconName: 'Target' },
        { title: 'Tone & Style', desc: `${tone} Calibration`, highlight: 'TONE', iconName: 'Sparkles' },
        { title: 'Format', desc: '16:9 High-Definition Widescreen', highlight: 'FORMAT', iconName: 'Monitor' }
      ]
    },
    speakerNotes: `Welcome everyone. Today we are presenting "${mainTitle}". We will examine core systems and applications tailored for ${effectiveAudience}.`
  });

  const slotsForContent = effectiveCount - 1;
  const stepRatio = rawSections.length > 0 ? rawSections.length / slotsForContent : 1;

  for (let slot = 0; slot < slotsForContent; slot++) {
    const slideNumber = slot + 2;
    const startIdx = Math.floor(slot * stepRatio);
    const endIdx = Math.floor((slot + 1) * stepRatio);
    const grouped = rawSections.slice(startIdx, Math.max(startIdx + 1, endIdx));

    if (grouped.length === 0) {
      slides.push({
        id: `slide-${slideNumber}-${Date.now()}`,
        slideNumber,
        title: 'Summary & Next Steps',
        subtitle: 'Key Action Items & Roadmap',
        layout: 'qa-conclusion',
        content: {
          headline: `Summary & Key Takeaways for ${mainTitle}`,
          bullets: [
            `Comprehensive mastery of ${mainTitle}`,
            'Actionable execution roadmap for rollout',
            'Open Q&A'
          ],
          cards: [
            { title: 'Open Discussion', desc: 'Clarifications and open questions.', highlight: 'Q&A', iconName: 'HelpCircle' },
            { title: 'Action Plan', desc: 'Phase 1 deployment over the next quarter.', highlight: 'Roadmap', iconName: 'CheckCircle' }
          ]
        },
        speakerNotes: `Thank you for your time. Let's open the floor for questions.`
      });
      continue;
    }

    const sTitle = grouped.map(g => g.title.replace(/^["'“‘\s\-—–:•*#\d\.\)]+/g, '').replace(/["'”’\s\-—–:•*]+$/g, '')).join(' & ');
    const sLower = sTitle.toLowerCase();
    const body = grouped.map(g => g.body).join('\n');

    const rawSentences = body
      .split(/(?<=[.?!])\s+|\r?\n+/)
      .map(s => s.trim().replace(/^[-*•—–]\s*/, ''))
      .filter(s => s.length > 5 && !/^(?:----------------|======|Visual:|Visual idea:|DESIGN REQUIREMENTS)/i.test(s));

    const subItems = body.includes(',') && rawSentences.length <= 1
      ? body.split(/,|;|\band\b/i).map(s => s.trim().replace(/^[-*•—–]\s*/, '')).filter(s => s.length > 4)
      : [];

    const bullets = rawSentences.length > 0 ? rawSentences : (subItems.length > 0 ? subItems : [body || sTitle]);
    const pointsForCards = bullets.length >= 2 ? bullets : (subItems.length >= 2 ? subItems : [body]);

    const activeHeadline = craftActiveHeadline(sTitle, body);
    const cards = pointsForCards.slice(0, 4).map((pt, pIdx) => {
      const ext = extractSubstantiveCardTitle(pt, pIdx);
      return {
        title: ext.title,
        desc: pt,
        highlight: ext.highlight,
        iconName: pIdx === 0 ? 'Cpu' : pIdx === 1 ? 'Layers' : pIdx === 2 ? 'TrendingUp' : 'CheckCircle'
      };
    });

    let layout = 'cards-3';
    let content = {};

    if (sLower.includes('challenge') || sLower.includes('risk') || sLower.includes('concern') || sLower.includes('vs')) {
      layout = 'split-comparison';
      const mid = Math.ceil(bullets.length / 2);
      content = {
        headline: activeHeadline,
        comparison: {
          leftTitle: 'Critical Challenges & Concerns',
          leftItems: bullets.slice(0, mid).length > 0 ? bullets.slice(0, mid) : ['Privacy & Security', 'Algorithmic Bias', 'Operational Overheads'],
          rightTitle: 'Governance & Safeguards',
          rightItems: bullets.slice(mid).length > 0 ? bullets.slice(mid) : ['Continuous Oversight', 'Robust Encryption Protocols', 'Compliance Auditing']
        }
      };
    } else if (sLower.includes('future') || sLower.includes('vision') || sLower.includes('roadmap') || sLower.includes('ecosystem')) {
      layout = 'timeline';
      const stages = ['Phase 01', 'Phase 02', 'Phase 03', 'Phase 04'];
      content = {
        headline: activeHeadline,
        timeline: pointsForCards.slice(0, 3).map((pt, pIdx) => {
          const words = pt.split(/\s+/).filter(w => w.length > 2 && !/^(such|as|the|and|for)$/i.test(w));
          return {
            step: stages[pIdx] || `Stage 0${pIdx + 1}`,
            title: words.slice(0, 3).join(' ').replace(/[^a-zA-Z0-9 ]/g, '') || `Phase 0${pIdx + 1}`,
            desc: pt
          };
        })
      };
    } else if (cards.length === 4) {
      layout = 'cards-4';
      content = { headline: activeHeadline, cards };
    } else {
      layout = 'cards-3';
      content = { headline: activeHeadline, bullets, cards: cards.slice(0, 3) };
    }

    slides.push({
      id: `slide-${slideNumber}-${Date.now()}`,
      slideNumber,
      title: activeHeadline,
      subtitle: sTitle,
      layout,
      content,
      speakerNotes: `On this slide, we examine ${sTitle}. Review these critical points: ${bullets.slice(0, 2).join('; ')}.`
    });
  }

  return {
    title: mainTitle,
    subtitle: `Tailored for ${effectiveAudience} (${tone} tone)`,
    slideCount: slides.length,
    slides,
    timestamp: new Date().toISOString()
  };
}
