import webpush from 'web-push';
import 'dotenv/config';
import express from 'express';
const DEVDARSHA_API_KEY =
process.env.DEVDARSHA_API_KEY;
import crypto from 'node:crypto';
import {read,write} from './store.js';
import {runNotifications} from './notifications.js';
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'32kb'}));
app.use(express.static('public'));
app.get('/health',(_req,res)=>res.json({ok:true,service:'vyoma-notifications'}));
app.get('/api/festivals', async (req, res) => {
  try {
    const date = req.query.date;
    const city = req.query.city;

    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof city !== 'string' ||
      !/^[a-z0-9-]{1,80}$/.test(city)
    ) {
      return res.status(400).json({
        error: 'Valid date and city are required'
      });
    }

    if (!DEVDARSHA_API_KEY) {
      return res.status(503).json({
        error: 'DevDarsha API key missing'
      });
    }

    const response = await fetch(
      'https://panchang.devdarsha.com/v1/panchang/daily',
      {
        method: 'POST',
        headers: {
          'X-Api-Key': DEVDARSHA_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          city_id: city,
	  faith_filter: 'all'
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) {
      return res.status(502).json({
        error: 'DevDarsha request failed',
        upstreamStatus: response.status
      });
    }

    const result = await response.json();

    res.json({
      date: result.data?.date,
      location: result.data?.location,
      festivals: result.data?.festivals?.data || []
    });

  } catch (error) {
    console.error('DevDarsha error:', error.message);
    res.status(503).json({
      error: 'Unable to retrieve festivals'
    });
  }
});
app.get('/api/push/public-key',(_req,res)=>res.json({publicKey:process.env.VAPID_PUBLIC_KEY||null}));
app.post('/api/subscriptions',(req,res)=>{
 const {subscription,timeZone,region,sendHour=9,consent}=req.body||{};
 if(consent!==true||!subscription?.endpoint||!subscription?.keys?.p256dh||!subscription?.keys?.auth)return res.status(400).json({error:'Valid push subscription and explicit consent required'});
 if(typeof timeZone!=='string'||timeZone.length>80)return res.status(400).json({error:'Valid IANA time zone required'});
 try{new Intl.DateTimeFormat('en',{timeZone});}catch{return res.status(400).json({error:'Invalid time zone'});}
 if(typeof region!=='string'||!/^[A-Z]{2}(?:-[A-Z0-9]{1,4})?$/.test(region))return res.status(400).json({error:'Region must be an ISO-like code such as IN-AP'});
 if(!Number.isInteger(sendHour)||sendHour<0||sendHour>23)return res.status(400).json({error:'sendHour must be 0–23'});
 const users=read('subscriptions',[]);const id=crypto.createHash('sha256').update(subscription.endpoint).digest('hex');
 const item={id,subscription,timeZone,region,sendHour,enabled:true};const index=users.findIndex(u=>u.id===id);if(index>=0)users[index]=item;else users.push(item);write('subscriptions',users);
 res.status(201).json({id,subscribed:true});
});
app.delete('/api/subscriptions',(req,res)=>{
 const endpoint=req.body?.endpoint;if(typeof endpoint!=='string')return res.status(400).json({error:'endpoint required'});
 const users=read('subscriptions',[]).filter(u=>u.subscription.endpoint!==endpoint);write('subscriptions',users);res.json({unsubscribed:true});
});
function admin(req,res,next){const expected=process.env.ADMIN_TOKEN;if(!expected||req.get('x-admin-token')!==expected)return res.status(401).json({error:'Unauthorized'});next();}
// VYOMA - Protected push notification test
app.post('/admin/test-push', admin, async (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      return res.status(503).json({
        error: 'VAPID configuration is incomplete'
      });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = read('subscriptions', [])
      .filter(item => item.enabled && item.subscription);

    if (subscriptions.length === 0) {
      return res.status(404).json({
        error: 'No active subscriptions found'
      });
    }

    const payload = JSON.stringify({
      title: 'VYOMA',
      body: 'Your first real backend push notification is working!',
      url: '/'
    });

    const results = await Promise.allSettled(
      subscriptions.map(item =>
        webpush.sendNotification(item.subscription, payload)
      )
    );

    const sent = results.filter(
      result => result.status === 'fulfilled'
    ).length;

    res.json({
      attempted: results.length,
      sent,
      failed: results.length - sent
    });

  } catch (error) {
    console.error('VYOMA push test:', error.message);
    res.status(503).json({
      error: 'Unable to send test notification'
    });
  }
});
app.post('/admin/run',admin,async(req,res)=>{try{res.json(await runNotifications({dryRun:req.body?.dryRun!==false}));}catch(err){res.status(503).json({error:err.message});}});
// Check once per minute; only users whose local hour matches are eligible.
let busy=false;async function tick(){if(busy)return;busy=true;try{const r=await runNotifications();if(r.attempted)console.log('Notification run',r);}catch(err){console.error('Scheduler:',err.message);}finally{busy=false;}}
const port=Number(process.env.PORT||3000);app.listen(port,()=>console.log(`VYOMA backend listening on port ${port}`));
if(process.env.ENABLE_SCHEDULER==='true'){setInterval(tick,60_000);tick();}
