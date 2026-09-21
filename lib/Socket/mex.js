import * as boom_1 from '@hapi/boom'
import * as WABinary_1 from '../WABinary/index.js'

export const wMexQuery = (variables, queryId, query, generateMessageTag) => {
    return query({
        tag: 'iq',
        attrs: {
            id: generateMessageTag(),
            type: 'get',
            to: WABinary_1.S_WHATSAPP_NET,
            xmlns: 'w:mex'
        },
        content: [
            {
                tag: 'query',
                attrs: { query_id: queryId },
                content: Buffer.from(JSON.stringify({ variables }), 'utf-8')
            }
        ]
    })
}

const decodeMexBinary = (buf) => {
    const text = buf.toString('utf-8')

    const out = {
        id: null,
        state: { type: 'UNKNOWN' },
        thread_metadata: {
            creation_time: '0',
            description: { text: '-' },
            invite: null,
            name: { text: '-' },
            subscribers_count: '0',
            verification: 'UNVERIFIED',
            picture: null,
            preview: null,
            settings: { reaction_codes: { value: 'ALL' } }
        },
        viewer_metadata: null
    }

    const jidMatch = text.match(/(\d+@newsletter)/)
    if (jidMatch) out.id = jidMatch[1]

    const stateMatch = text.match(/(ACTIVE|SUSPENDED|GEOSUSPENDED|DELETED)/)
    if (stateMatch) out.state.type = stateMatch[1]

    const invMatch = text.match(/(0029[A-Za-z0-9]{20})/)
    if (invMatch) out.thread_metadata.invite = invMatch[1]

    if (out.state.type !== 'UNKNOWN') {
        const statePos = text.indexOf(out.state.type)
        if (statePos !== -1) {
            let rest = text.substring(statePos + out.state.type.length)
            rest = rest.replace(/^[^\x20-\x7E]+/, '')

            const ctMatch = rest.match(/^(\d{10})/)
            if (ctMatch) {
                const ct = parseInt(ctMatch[1])
                if (ct > 1577836800 && ct < 1893456000) out.thread_metadata.creation_time = ctMatch[1]
                rest = rest.substring(ctMatch[1].length)
            }

            rest = rest.replace(/^[^\x20-\x7E]+/, '')

            const nameMatch = rest.match(/^([A-Za-z][A-Za-z0-9\s\-\.\/&_''()]{2,150}?)(?=\d{10,})/)
            if (nameMatch) {
                out.thread_metadata.name.text = nameMatch[1].trim()
            }
        }
    }

    const picMatch = text.match(/(\/m1\/[^\s\x00\x0c\xb4?]+)/)
    if (picMatch) {
        out.thread_metadata.preview = { direct_path: picMatch[1] }
    }

    const descMatch = text.match(/(No Admin[^\x00-\x1F]{5,500})/)
    if (descMatch) {
        out.thread_metadata.description.text = descMatch[1].replace(/[^\x20-\x7E\n]/g, '').trim()
    }

    if (text.includes('VERIFIED') && !text.includes('UNVERIFIED')) {
        out.thread_metadata.verification = 'VERIFIED'
    }

    return out
}

export const executeWMexQuery = async (variables, queryId, dataPath, query, generateMessageTag) => {
    const result = await wMexQuery(variables, queryId, query, generateMessageTag)
    const child = (0, WABinary_1.getBinaryNodeChild)(result, 'result')

    if (child?.content) {
        const buf = Buffer.isBuffer(child.content) ? child.content : Buffer.from(String(child.content), 'utf-8')
        const rawText = buf.toString('utf-8')

        let data
        const firstBrace = rawText.indexOf('{')
        const lastBrace = rawText.lastIndexOf('}')

        if (firstBrace !== -1 && lastBrace > firstBrace) {
            try {
                data = JSON.parse(rawText.substring(firstBrace, lastBrace + 1))
            } catch (e) {
                data = null
            }
        }

        if (data) {
            if (data.errors && data.errors.length > 0) {
                const errorMessages = data.errors.map(err => err.message || 'Unknown error').join(', ')
                const firstError = data.errors[0]
                const errorCode = firstError.extensions?.error_code || 400
                throw new boom_1.Boom(`GraphQL server error: ${errorMessages}`, { statusCode: errorCode, data: firstError })
            }
            const response = dataPath ? data?.data?.[dataPath] : data?.data
            if (typeof response !== 'undefined') {
                return response
            }
        }

        if (dataPath === 'xwa2_newsletter') {
            return decodeMexBinary(buf)
        }

        if (dataPath && dataPath.startsWith('xwa2_newsletter_')) {
            const stateMatch = rawText.match(/(ACTIVE|SUSPENDED|GEOSUSPENDED|DELETED)/)
            return {
                success: true,
                state: stateMatch ? stateMatch[1] : 'ACTIVE'
            }
        }

        if (rawText.length > 0) {
            return { success: true, raw: rawText }
        }
    }

    const action = (dataPath || '').startsWith('xwa2_')
        ? dataPath.substring(5).replace(/_/g, ' ')
        : dataPath?.replace(/_/g, ' ')
    throw new boom_1.Boom(`Failed to ${action}, unexpected response structure.`, { statusCode: 400, data: result })
}
