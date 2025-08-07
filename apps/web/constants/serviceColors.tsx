import crypto from 'crypto';
export const serviceColoring: any = {
    1: "yellow",
    2: "blue",
    3: "pink",
    4: "red",
    5: "green",
  }

  export function isValidJSON(str:string) {
    try {
      JSON.parse(str);
      return true;
    } catch (error) {
      return false;
    }
  }

function base64urlEncode(input: string | Buffer): string {
  return Buffer.from(input)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

export function createAuthenticationJwtToken(secret: string = ''): string {
    // Checking Secret Key
    if (typeof process.env.NEXT_PUBLIC_XDS_JWT_SECRET_KEY !== 'undefined') {
        secret = process.env.NEXT_PUBLIC_XDS_JWT_SECRET_KEY;
    }
    const headers = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const payload = {
        exp: Math.floor(Date.now() / 1000) + 60 // 1 min expiration
    };

    const headersEncoded = base64urlEncode(JSON.stringify(headers));
    const payloadEncoded = base64urlEncode(JSON.stringify(payload));
    // console.log(process.env.NEXT_PUBLIC_XDS_JWT_SECRET_KEY);
    // console.log(headersEncoded, payloadEncoded);
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${headersEncoded}.${payloadEncoded}`)
        .digest('base64');
    // console.log(signature);
    const signatureEncoded = base64urlEncode(signature);
    // console.log(signatureEncoded);
    const jwt = `${headersEncoded}.${payloadEncoded}.${signatureEncoded}`;

    return jwt;
}
