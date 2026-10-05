/* A stand-in for /microservice/contact on the Vite dev server.
 *
 * It imitates the platform's shape rather than its internals, because that
 * shape is what the browser code has to cope with:
 *
 *   - form-encoded in, HTTP 200 out whether the submission was accepted or
 *     not, with the verdict in the body;
 *   - and, when the reCAPTCHA token is missing or rejected, an `error` field
 *     returned ALONGSIDE a stored row — because `return` does not halt
 *     execution on that platform, so the insert and the email go ahead even
 *     when the check fails.
 *
 * That last part is the behaviour worth rehearsing against locally. It is
 * also why the captcha cannot actually block anything until that endpoint is
 * changed; see server/platform-endpoint.txt.
 *
 * Nothing is sent. A submission is printed to the terminal instead.
 * DEV_RECAPTCHA_FAIL=1 makes every submission come back as a captcha failure,
 * to see that path without real keys.
 *
 * Development only. Vite plugins do not ship in the build.
 */

const readBody = req => new Promise(resolve => {
  let raw = '';
  req.on('data', c => {raw += c;});
  req.on('end', () => resolve(new URLSearchParams(raw)));
});

const send = (res, payload) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

export default function devContact() {
  return {
    name: 'dev-contact-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.config.logger.info(
        '  [dev-contact] platform stand-in at /microservice/contact' +
        (process.env.DEV_RECAPTCHA_FAIL ? ' (captcha set to FAIL)' : '')
      );

      server.middlewares.use('/microservice/contact', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        const p = await readBody(req);
        const get = k => (p.get(k) || '').trim();
        const token = get('g-recaptcha-response');

        const row = {
          name: get('name'), email: get('email'), company: get('company'),
          interest: get('interest'), message: get('message'),
          elapsed: get('elapsed')
        };

        /* An absent token is not treated as a failure here, because locally
           there is usually no site key and so nothing to mint one with. The
           failure path is opt-in via DEV_RECAPTCHA_FAIL, which is what the
           real endpoint does when Google rejects a token.

           Either way the row is written and the email sent — that is the part
           of the real endpoint worth imitating. Only the error field moves. */
        const captchaFailed = !!process.env.DEV_RECAPTCHA_FAIL;

        console.log('\n[contact] --- the endpoint would store this and email it ---');
        console.log(`  Name:     ${row.name}`);
        console.log(`  Email:    ${row.email}`);
        console.log(`  Company:  ${row.company || 'Not specified'}`);
        console.log(`  Interest: ${row.interest}`);
        console.log(`  Message:  ${row.message}`);
        console.log(`  Token:    ${token ? token.slice(0, 24) + '...' : '(none)'}`);
        if (get('website')) {
          console.log('  NOTE: the honeypot was filled, so this came from a bot —');
          console.log('        and the real endpoint would still store and email it.');
        }
        console.log('[contact] --- nothing was actually sent ---\n');

        if (captchaFailed) {
          return send(res, {
            error: 'reCAPTCHA verification failed. Please try again.',
            contact: {errors: [], success: true, row},
            success: true, hasError: false
          });
        }
        send(res, {contact: {errors: [], success: true, row}, success: true, hasError: false});
      });
    }
  };
}
