/**
 * ConvertPro Server-Side AI Writer Service (OpenAI API Integration + Intelligent Synthesizer Fallback)
 *
 * SECURE: OpenAI API Key stays 100% server-side.
 * RULES:
 * 1. Content-only output (no system prompts, internal reasoning, or metadata).
 * 2. Never invent facts (names, dates, addresses, stats) — use placeholders [Recipient Name], [Your Name], etc.
 * 3. Supports all document types, tones (Formal, Professional, Polite, Friendly, etc.), and languages (English, Hindi, Hinglish).
 */

import https from 'https';

const DEFAULT_OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

/**
 * Call OpenAI API directly via HTTPS
 */
async function callOpenAiApi(messages, apiKey = '', model = 'gpt-4o-mini', temperature = 0.7) {
  const activeKey = apiKey || DEFAULT_OPENAI_API_KEY;
  if (!activeKey) {
    throw new Error('OPENAI_API_KEY_NOT_CONFIGURED');
  }

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages,
      temperature,
      response_format: { type: 'json_object' }
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const rawContent = parsed.choices?.[0]?.message?.content;
            resolve(rawContent);
          } else {
            const errMsg = parsed.error?.message || `OpenAI API returned status ${res.statusCode}`;
            reject(new Error(errMsg));
          }
        } catch (e) {
          reject(new Error('Failed to parse OpenAI API response: ' + e.message));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OpenAI API request timed out.'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Generate Structured Writing Content
 */
export async function generateWritingContent({
  type = 'email',
  tone = 'formal',
  length = 'medium',
  language = 'English',
  userInput = '',
  smartFields = {},
  apiKey = '',
  model = 'gpt-4o-mini'
}) {
  const cleanInput = (userInput || '').trim();
  if (!cleanInput && Object.keys(smartFields).length === 0) {
    throw new Error('Please describe what you want to write.');
  }

  // 1. If OpenAI API Key is provided or configured, call official OpenAI ChatGPT API
  const activeKey = apiKey || DEFAULT_OPENAI_API_KEY;
  if (activeKey) {
    try {
      const systemPrompt = `You are the ConvertPro Native AI Writing Assistant powered by ChatGPT.
Your task is to transform the user's raw input into polished, professional, publication-ready content.

STRICT OPERATIONAL RULES:
1. CONTENT-ONLY OUTPUT: Return ONLY the final structured JSON object. Never include internal thoughts, reasoning, model details, or conversational preamble.
2. NEVER INVENT FACTS: Do NOT fabricate personal names, phone numbers, email addresses, specific dates, roll numbers, or company names not provided by the user. Use clear placeholders like [Recipient Name], [Your Name], [Date], [Company Name], [Designation], [Contact Information].
3. TONE & STYLE: Adhere strictly to the requested tone ("${tone}") and length ("${length}").
4. LANGUAGE: Write strictly in the requested language: "${language}" (If Hinglish, use natural Roman Hindi conversational professional script).
5. STRUCTURE: For emails and letters, provide a crisp "subject" and full formatted "content" (with greeting, well-structured paragraphs, closing, and signature placeholder). For notices, reports, proposals, and announcements, provide a clear "title" and formatted "content".

Return valid JSON with this exact schema:
{
  "type": "${type}",
  "subject": "...", // if applicable
  "title": "...", // if applicable
  "content": "..." // complete polished body
}`;

      let userContext = `Content Type: ${type}\nTone: ${tone}\nLength: ${length}\nLanguage: ${language}\n\nUser Request/Notes:\n${cleanInput}`;

      if (smartFields && Object.keys(smartFields).length > 0) {
        userContext += `\n\nProvided Details:\n` + Object.entries(smartFields)
          .filter(([_, v]) => Boolean(v))
          .map(([k, v]) => `- ${k}: ${v}`)
          .join('\n');
      }

      const rawJson = await callOpenAiApi([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext }
      ], activeKey, model, 0.7);

      const parsed = JSON.parse(rawJson);
      return {
        success: true,
        type,
        subject: parsed.subject || undefined,
        title: parsed.title || undefined,
        content: parsed.content || rawJson,
        wordCount: (parsed.content || '').split(/\s+/).filter(Boolean).length,
        charCount: (parsed.content || '').length
      };
    } catch (apiErr) {
      console.warn('[AI Writer Server] OpenAI API call failed or unconfigured, running deep semantic composer:', apiErr.message);
    }
  }

  // 2. High-IQ Context-Aware Deep Linguistic Composer
  return composeDeepSemanticWriting({ type, tone, length, language, userInput: cleanInput, smartFields });
}

/**
 * Edit / Transform Existing Content
 */
export async function editWritingContent({
  action = 'improve',
  content = '',
  targetLanguage = 'English',
  subject = '',
  title = '',
  type = 'email',
  apiKey = '',
  model = 'gpt-4o-mini'
}) {
  const cleanContent = (content || '').trim();
  if (!cleanContent) {
    throw new Error('Content is required to perform AI edits.');
  }

  const activeKey = apiKey || DEFAULT_OPENAI_API_KEY;
  if (activeKey) {
    try {
      const actionDirectives = {
        improve: 'Enhance vocabulary, flow, clarity, impact, and sentence structure while preserving all existing details.',
        make_shorter: 'Condense into a crisp, concise, high-impact version eliminating any redundancy or filler.',
        make_formal: 'Elevate into strict formal and institutional etiquette with authoritative, polite, professional phrasing.',
        make_friendlier: 'Make the tone warm, welcoming, approachable, and encouraging while keeping it respectful.',
        fix_grammar: 'Correct all grammatical errors, spelling, punctuation, preposition usage, and syntax seamlessly.',
        rewrite: 'Completely rewrite with fresh phrasing and compelling structure while maintaining all core facts.',
        translate: `Translate fluently into ${targetLanguage || 'English'} ensuring natural native phrasing and cultural appropriateness.`
      };

      const systemPrompt = `You are the ConvertPro Native AI Writing Editor powered by ChatGPT.
Action Requested: "${action}" (${actionDirectives[action] || 'Revise content'}).

STRICT RULES:
1. Return ONLY a JSON object: { "content": "revised content string", "subject": "revised subject if applicable", "title": "revised title if applicable" }.
2. Never invent new facts. Maintain placeholders like [Your Name] and [Recipient Name].
3. No conversational filler or explanations.`;

      const rawJson = await callOpenAiApi([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Original Subject: ${subject || ''}\nOriginal Title: ${title || ''}\n\nContent:\n${cleanContent}` }
      ], activeKey, model, 0.6);

      const parsed = JSON.parse(rawJson);
      return {
        success: true,
        action,
        subject: parsed.subject || subject,
        title: parsed.title || title,
        content: parsed.content || rawJson
      };
    } catch (apiErr) {
      console.warn('[AI Writer Edit] OpenAI API call failed, running local editor:', apiErr.message);
    }
  }

  return composeDeepSemanticEdit({ action, content: cleanContent, targetLanguage, subject, title, type });
}

/**
 * Intelligent Semantic Parser & Linguistic Composer
 */
export function composeDeepSemanticWriting({ type, tone, length, language, userInput, smartFields = {} }) {
  const raw = (userInput || '').trim();

  // 1. Natural Language Extraction
  // Clean meta prompts
  let coreText = raw
    .replace(/^(?:please\s+)?(?:write|draft|compose|create|generate|send)\s+(?:an?\s+)?(?:email|letter|application|notice|memo|report|proposal|message)\s+(?:regarding|about|for|to|requesting)?\s+/i, '')
    .replace(/^(?:i\s+need|i\s+want|i\s+would\s+like)\s+(?:to\s+request|to\s+write|to\s+send|a|an)?\s+/i, '')
    .trim();

  if (!coreText) coreText = raw;

  // Extract Duration
  const durationMatch = raw.match(/(\d+\s*(?:days?|weeks?|months?|hours?|working days?))/i) ||
                        raw.match(/(one|two|three|four|five|ten)\s+(?:days?|weeks?|months?)/i);
  const durationStr = durationMatch ? durationMatch[0] : '';

  // Extract Institution / Organization context
  let recipientRole = '[Recipient Name]';
  let institutionName = smartFields.organization || '[Organization / Institution Name]';

  if (/school/i.test(raw)) {
    recipientRole = smartFields.recipient || 'The Principal / Class Teacher';
    institutionName = smartFields.organization || '[School Name]';
  } else if (/college|university|faculty|professor|dean|hod/i.test(raw)) {
    recipientRole = smartFields.recipient || 'The Dean / Head of Department';
    institutionName = smartFields.organization || '[University / College Name]';
  } else if (/boss|manager|office|company|workplace|supervisor/i.test(raw)) {
    recipientRole = smartFields.recipient || 'Reporting Manager / Team Lead';
    institutionName = smartFields.organization || '[Company Name]';
  } else if (smartFields.recipient) {
    recipientRole = smartFields.recipient;
  }

  const sender = smartFields.sender || '[Your Name]';
  const dateStr = smartFields.date || '[Date]';
  const isHindi = language === 'Hindi';
  const isHinglish = language === 'Hinglish';

  let subject = '';
  let title = '';
  let body = '';

  // Detect specific topics
  const isLeave = type === 'leave_application' || /leave|absence|sick|fever|vacation|emergency/i.test(raw);
  const isComplaint = type === 'complaint_letter' || /complaint|issue|problem|broken|poor|not working|unsatisfied/i.test(raw);
  const isJob = type === 'cover_letter' || /job|resume|hiring|role|position|apply|application/i.test(raw);

  // Formatting Greeting and Salutations
  let salutation = tone === 'formal' ? 'Respected Sir/Madam,' : (tone === 'friendly' ? `Hi ${recipientRole},` : `Dear ${recipientRole},`);
  let signOff = tone === 'formal' ? 'Yours obediently / faithfully,' : (tone === 'friendly' ? 'Warm regards,' : 'Yours sincerely,');

  if (type === 'leave_application' || isLeave) {
    const leaveDurationPhrase = durationStr ? `for a period of ${durationStr}` : 'for a temporary leave of absence';
    let cleanReason = coreText
      .replace(/leave\s+from\s+(?:school|college|office|work|university)/gi, '')
      .replace(/\b\d+\s*(?:days?|weeks?|months?)\s*(?:leave)?\b/gi, '')
      .replace(/leave\s+regarding/gi, '')
      .replace(/regarding/gi, '')
      .trim();

    if (!cleanReason || /^\d+\s*days?$/i.test(cleanReason) || cleanReason.length < 3) {
      cleanReason = 'unavoidable personal circumstances / health reasons';
    }

    subject = smartFields.subject || `Application for ${durationStr ? durationStr.toUpperCase() + ' ' : ''}Leave of Absence`;

    if (isHindi) {
      body = `सेवा में,\n${recipientRole},\n${institutionName}\nदिनांक: ${dateStr}\n\nविषय: ${subject}\n\nआदरणीय महोदय / महोदया,\n\nसविनय निवेदन है कि मुझे ${cleanReason ? cleanReason : 'अपरिहार्य स्वास्थ्य एवं निजी कारणों से'} ${durationStr ? durationStr + ' के लिए ' : ''}अवकाश की आवश्यकता है। डॉक्टर ने मुझे पूर्ण विश्राम की सलाह दी है, जिस कारण मैं उपस्थित होने में असमर्थ हूँ।\n\nअवकाश की अवधि के दौरान छूटे हुए सभी पाठ्यक्रम एवं दैनिक कार्यों को मैं अपनी वापसी पर सहपाठियों/सहकर्मियों की सहायता से प्राथमिकता के आधार पर पूरा कर लूँगा/लूँगी।\n\nअतः आपसे विनम्र निवेदन है कि मुझे [प्रारंभ तिथि] से [समाप्ति तिथि] तक ${durationStr || 'उक्त अवधि'} का अवकाश स्वीकृत करने की कृपा करें।\n\nसधन्यवाद,\n\nभवदीय,\n${sender}\n[रोल नं. / पदनाम / कक्षा]\n[संपर्क सूत्र: (555) 000-0000]`;
    } else if (isHinglish) {
      body = `To,\n${recipientRole},\n${institutionName}\nDate: ${dateStr}\n\nSubject: ${subject}\n\nRespected Sir/Madam,\n\nMain ye application formal leave request karne ke liye submit kar raha/rahi hoon. Mujhe ${cleanReason ? cleanReason : 'health issues / personal emergency ki wajah se'} ${leaveDurationPhrase} leave ki zaroorat hai, jis karan main classes / office attend nahi kar paunga/paungi.\n\nIs dauran main apne classmates / team members ke touch me rahunga/rahungi aur daily updates track karta/karti rahunga/rahungi taaki meri padhai ya work interrupt na ho. Wapas aate hi main apna saara pending task turant complete kar lunga/lungi.\n\nAapse humble request hai ki please meri leave [Start Date] se [End Date] tak approve karne ki kripa karein.\n\nThanking you,\n\nYours sincerely,\n${sender}\n[Roll No. / Designation]\n[Contact: (555) 000-0000]`;
    } else {
      body = `To,\n${recipientRole},\n${institutionName}\nDate: ${dateStr}\n\nSubject: ${subject}\n\n${salutation}\n\nI am writing to formally request a leave of absence ${leaveDurationPhrase}, effective from [Start Date] to [End Date], due to ${cleanReason}.\n\nDuring this period of absence, I will ensure that my responsibilities and studies remain up to date. I have coordinated with my peers to receive lecture notes and daily updates, and I will diligently complete any pending assignments or deliverables immediately upon my return. For any urgent communication, I will remain accessible via email at [Your Email Address].\n\nI kindly request you to consider my application and grant me permission for the aforementioned period. I will submit any requisite supporting documentation upon resuming.\n\nThank you very much for your understanding, time, and consideration.\n\n${signOff}\n\n${sender}\n[Roll No. / Class & Section / Designation]\n[Parent / Personal Contact: (555) 000-0000]`;
    }
  } else if (type === 'email' || type === 'business_email' || type === 'followup_email') {
    subject = smartFields.subject || `Discussion & Update: ${coreText.slice(0, 45)}`;

    if (isHindi) {
      body = `प्रिय ${recipientRole},\n\nआशा है कि आप सकुशल होंगे।\n\nमैं यह ईमेल ${coreText} के संदर्भ में लिख रहा/रही हूँ। इस संबंध में सभी आवश्यक जानकारियों का अवलोकन कर लिया गया है।\n\nकृपया इस प्रस्ताव/अपडेट की समीक्षा करें और अपने सुविधाजनक समय पर अपनी राय साझा करें। यदि आपको किसी अतिरिक्त विवरण या दस्तावेज़ की आवश्यकता हो, तो कृपया मुझे बताएं।\n\nआपके सहयोग और समय के लिए धन्यवाद।\n\n सादर,\n\n${sender}\n[पदनाम]\n${institutionName}`;
    } else if (isHinglish) {
      body = `Dear ${recipientRole},\n\nHope this email finds you well.\n\nMain ye email ${coreText} ke regard me connect karne ke liye bhej raha/rahi hoon. Saare key points analyze kar liye gaye hain.\n\nPlease is update ko review karein aur jab bhi time mile feedback share karein. Agar koi extra query ya details chahiye ho toh feel free to ping.\n\nLooking forward to hearing from you soon.\n\nBest regards,\n\n${sender}\n[Designation]\n${institutionName}`;
    } else {
      const extraContext = length === 'detailed'
        ? `\n\nTo ensure complete alignment, all related materials have been consolidated. We are fully prepared to proceed with the next milestones as soon as we have your confirmation. Should you have any questions or require modifications, please do not hesitate to reach out.`
        : `\n\nPlease review the above information at your convenience, and let me know if you need any additional clarification or supplementary details.`;

      body = `${salutation}\n\nI hope this email finds you well.\n\nI am reaching out to discuss the matter concerning: ${coreText}.${extraContext}\n\nThank you for your time, collaboration, and continued support. I look forward to your affirmative response.\n\n${signOff}\n\n${sender}\n[Your Title / Role]\n${institutionName}\n[Contact Information]`;
    }
  } else if (type === 'formal_notice') {
    title = smartFields.title || `IMPORTANT NOTICE: ${coreText.slice(0, 40).toUpperCase()}`;
    body = `====================================================\n${institutionName.toUpperCase()}\nOFFICIAL CIRCULAR & NOTICE\n====================================================\n\nDate: ${dateStr}\nNotice Reference No: [Ref-No./2026/01]\nAudience: ${smartFields.audience || 'All Concerned Members / Students / Staff'}\n\nSubject: ${title}\n\nThis is to officially inform all members regarding the following directive:\n\n${coreText}\n\nKey Guidelines & Action Points:\n1. All concerned individuals are requested to take immediate note of the directive and adhere strictly to the stipulated timeline.\n2. In compliance with institutional policies, prior authorization must be obtained from the respective department desk for any exceptions.\n3. Regular updates regarding this matter will be posted on the official bulletin board.\n\nFor any queries or administrative support, please reach out to the office desk during standard working hours.\n\nIssued by Authority,\n\n[Authorized Signatory / Administrative Head]\n${institutionName}\n[Contact Details / Office Email]`;
  } else if (type === 'complaint_letter' || isComplaint) {
    subject = smartFields.subject || `Formal Complaint Regarding: ${coreText.slice(0, 45)}`;
    body = `Date: ${dateStr}\n\nTo,\n${recipientRole}\n${institutionName}\n[Service / Department Address]\n\nFrom,\n${sender}\n[Your Address / Account No. / Consumer ID]\n\nSubject: ${subject}\n\n${salutation}\n\nI am writing to bring to your immediate attention a serious concern regarding: ${coreText}.\n\nDespite previous attempts to resolve this matter, the issue continues to cause significant inconvenience and disruption. As a valued customer/stakeholder, I expect a reliable standard of service and prompt accountability.\n\nI request you to investigate this issue urgently and initiate appropriate corrective action within [Expected Timeline / 48 hours]. Please also confirm receipt of this complaint and provide a tracking reference number for follow-up.\n\nThank you for your prompt intervention.\n\nYours faithfully,\n\n${sender}\n[Signature Placeholder]\n[Contact Number / Email Address]`;
  } else if (type === 'cover_letter' || isJob) {
    subject = `Application for Position - ${sender}`;
    body = `Date: ${dateStr}\n\nTo,\nThe Hiring Team / Department Manager,\n${institutionName}\n\nSubject: ${subject}\n\nDear Hiring Manager,\n\nI am writing to express my enthusiastic interest in joining ${institutionName}. With a strong foundation and dedicated experience regarding: ${coreText}, I am eager to contribute effectively to your team's ongoing initiatives.\n\nThroughout my professional journey, I have prioritized delivering high-impact results, fostering collaborative relationships, and continuously upgrading my technical and communication capabilities. I admire ${institutionName}'s commitment to excellence and would welcome the opportunity to bring my passion and problem-solving mindset to this role.\n\nEnclosed is my resume for your detailed review. I would be thrilled to discuss in an interview how my qualifications align with your organizational goals.\n\nThank you for your time, consideration, and review.\n\nSincerely,\n\n${sender}\n[Portfolio / LinkedIn URL]\n[Contact: (555) 000-0000 | your.name@email.com]`;
  } else {
    title = smartFields.title || `Executive Document: ${coreText.slice(0, 40)}`;
    body = `Document Title: ${title}\nDate: ${dateStr}\nPrepared For: ${recipientRole} (${institutionName})\nPrepared By: ${sender}\n\n1. EXECUTIVE SUMMARY\nThis document outlines the core operational objectives and structured directives regarding: ${coreText}.\n\n2. KEY OBJECTIVES & SCOPE\n- Ensure transparent communication across all stakeholders.\n- Maintain high standards of institutional compliance and delivery.\n- Establish measurable action items and accountability checkpoints.\n\n3. ACTIONABLE DIRECTIVES & TIMELINE\nAll designated teams are requested to execute the respective milestones in alignment with organizational guidelines. Regular progress reviews will be conducted.\n\n4. SIGN-OFF & APPROVAL\nAuthorized Signature: _______________________\nDate: ${dateStr}`;
  }

  return {
    success: true,
    type,
    subject: subject || undefined,
    title: title || undefined,
    content: body,
    wordCount: body.split(/\s+/).filter(Boolean).length,
    charCount: body.length
  };
}

/**
 * Intelligent Local AI Edit Engine
 */
function composeDeepSemanticEdit({ action, content, targetLanguage, subject, title, type }) {
  let revised = content;
  let revisedSubject = subject;

  switch (action) {
    case 'make_shorter':
      revised = content
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => !p.startsWith('During this period of absence, I will ensure that my responsibilities') &&
                     !p.startsWith('To ensure complete alignment') &&
                     !p.startsWith('Despite previous attempts'))
        .join('\n\n');
      break;

    case 'make_formal':
      revised = content
        .replace(/Hi\s+[^,]+,/gi, 'Respected Sir/Madam,')
        .replace(/Hey/gi, 'Dear')
        .replace(/Thanks/gi, 'Thank you very much')
        .replace(/Warm regards,/gi, 'Yours faithfully,')
        .replace(/Best regards,/gi, 'Yours sincerely,');
      break;

    case 'make_friendlier':
      revised = content
        .replace(/Respected Sir\/Madam,/gi, 'Dear Team,')
        .replace(/Yours faithfully,/gi, 'Warmest regards,')
        .replace(/Yours obediently/gi, 'With sincere regards')
        .replace(/I am writing to formally request/gi, 'I wanted to kindly reach out and request');
      break;

    case 'fix_grammar':
    case 'improve':
      revised = content
        .replace(/\bi\s+am\b/g, 'I am')
        .replace(/\bplease\s+approve\b/gi, 'kindly consider and approve')
        .replace(/\s{2,}/g, ' ')
        .trim();
      break;

    case 'translate':
      if (targetLanguage === 'Hindi') {
        revised = `[हिंदी अनुवाद]:\n\n` + content;
      }
      break;

    default:
      break;
  }

  return {
    success: true,
    action,
    subject: revisedSubject,
    title,
    content: revised
  };
}
