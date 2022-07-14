const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.static('assets'));

async function newBrowserTab(url) {
  const browser = await puppeteer.launch({args:['--no-sandbox']}); // launch option for heroku
//  const browser = await puppeteer.launch({headless:true, executablePath:'/usr/bin/chromium'});
  const page = await browser.newPage();
  await page.goto(url, {waitUnit: 'networkidle0'});
  return page;
}

async function healthdec(page) {
  let selectors = ['#health_response_close_contact_discharge_not_fulfil_no',
                   '#health_response_infected_discharge_not_fulfil_no',
                   '#health_response_close_contact_to_quarantine_no',
                   '#health_response_symptoms_no',
                   '#btn_submit_health_response',
                   '#btn_confirm_health_response'];
  for (let selector of selectors) {
    let btn = await page.waitForSelector(selector, {visible: true});
    await btn.focus();
    await btn.click();
  }
  await page.waitForNavigation({waitUntil:'networkidle0'});
}

app.post('/', bodyParser.urlencoded({ extended: false }), async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.sendStatus(404);
  }

  let page = await newBrowserTab('https://healthdec.hkbu.edu.hk/');
  try {
    await page.evaluate('singleSignOn()');
    let userNameInput = await page.waitForSelector('input[name="ssoid"]',{visible: true});
    await userNameInput.type(req.body.username);
    await page.evaluate(() => {
if (!validateSsoId()) { return false } else { materialize_js.modal.loading_modal.open(); };A4J.AJAX.Submit('form_sign_in',event,{'oncomplete':function(request,event,data){materialize_js.modal.loading_modal.close(); },'similarityGroupingId':'btn_next','parameters':{'btn_next':'btn_next'} } );return false;
    });
    let passwordInput = await page.waitForSelector('#pwd', {visible: true});
    await passwordInput.type(req.body.password+'\n');

    await healthdec(page);
    await page.browser().close();
    return res.send('Done!');
  } catch(ex) {
    console.log(ex);
    await page.browser().close();
    return res.sendStatus(500);
  }
});

app.put('/', bodyParser.urlencoded({ extended: false }), async (req, res) => {
  if (!req.body.code) {
    return res.sendStatus(404);
  }
  let page = await newBrowserTab(`https://healthdec.hkbu.edu.hk/visitor_form/request/${req.body.code}`);
  try {
    //let codeInput = await page.waitForSelector('#input_qrcode_id', {visable:true});
    //await codeInput.type(req.body.code+'\n');
    await healthdec(page);
    await page.browser().close();
    return res.send('Done!');
  } catch(ex) {
    console.log(ex);
    await page.browser().close();
    return res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(` listening at http://localhost:${port}`)
})
