const crypto = require('crypto');
const { checkHtmlApp } = require('./html-app');

const AI_RICH_HTML_PRIMITIVE = 'GenAIaeacdsnwHtmlPrimitive';

function htmlSection(html, { trustedSources = [], height, typename = AI_RICH_HTML_PRIMITIVE, url, sectionTypename = 'GenAIUnifiedResponseSection' } = {}) {
  if (typeof html !== 'string' || html.trim() === '') {
    throw new TypeError('htmlSection requires a non-empty HTML string');
  }
  if (!Array.isArray(trustedSources)) {
    throw new TypeError('htmlSection trustedSources must be an array of strings');
  }
  if (typeof typename !== 'string' || typename.trim() === '') {
    throw new TypeError('htmlSection typename must be a non-empty string');
  }
  if (url !== undefined && (typeof url !== 'string' || url.trim() === '')) {
    throw new TypeError('htmlSection url must be a non-empty string');
  }

  const primitive = {
    __typename: typename,
    trusted_sources: trustedSources,
    payload: String(html).trim()
  };

  if (height !== undefined) {
    primitive.height = height;
  }
  if (url) {
    primitive.url = url;
  }

  return {
    __typename: sectionTypename,
    view_model: {
      __typename: 'GenAISingleLayoutViewModel',
      primitive
    }
  };
}

async function sendHtmlApp(conn, jid, html, options = {}) {
  const {
    title = '',
    label,
    trustedSources,
    height,
    url,
    typename = AI_RICH_HTML_PRIMITIVE,
    ...rest
  } = options;

  if (!conn) throw new TypeError('sendHtmlApp requires socket');
  if (!jid) throw new TypeError('sendHtmlApp requires jid');

  // Validasi HTML
  try {
    const report = checkHtmlApp(html, { height });
    if (!report.ok) {
      conn.logger?.warn?.({ jid }, 'html app problems: ' + report.problems.join('; '));
    }
  } catch (_) {}

  // Build sections
  const sections = [
    htmlSection(html, { trustedSources, height, url, typename })
  ];

  // Kalau ada label, tambah text section di atas
  if (label) {
    sections.unshift({
      __typename: 'GenAIUnifiedResponseSection',
      view_model: {
        __typename: 'GenAISingleLayoutViewModel',
        primitive: {
          __typename: 'GenAIMarkdownTextUXPrimitive',
          text: String(label),
          inline_entities: []
        }
      }
    });
  }

  // Build payload
  const responseId = crypto.randomUUID();
  const payloadData = Buffer.from(JSON.stringify({
    __typename: 'GenAIUnifiedResponse',
    response_id: responseId,
    sections
  })).toString('base64');

  const messageContent = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          unifiedResponse: {
            data: payloadData
          },
          contextInfo: {
            isForwarded: true,
            forwardOrigin: 4
          }
        }
      }
    }
  };

  // Kirim via relayMessage
  const { generateWAMessageFromContent } = require('./messages');
  const msg = generateWAMessageFromContent(jid, messageContent, {});
  return await conn.relayMessage(jid, msg.message, { messageId: msg.key.id, ...rest });
}

module.exports = {
  AI_RICH_HTML_PRIMITIVE,
  htmlSection,
  sendHtmlApp
};
