require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = Number(process.env.PORT || 5000);
const DB = path.join(__dirname, 'data', 'demo.json');
const UPLOADS = path.join(__dirname, 'uploads');
fs.mkdirSync(path.dirname(DB), {recursive:true});
fs.mkdirSync(UPLOADS, {recursive:true});
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({users:[],contacts:[],alerts:[],journeys:[],evidence:[]},null,2));
let db = JSON.parse(fs.readFileSync(DB,'utf8'));
const persist = () => fs.writeFileSync(DB, JSON.stringify(db,null,2));
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const fail = (res,status,message) => res.status(status).json({success:false,error:message});
const userById = id => db.users.find(x=>x.id===id);
const accepted = userId => db.contacts.filter(c=>c.userId===userId && c.status==='accepted');
const safeUser = u => ({id:u.id,name:u.name,phone:u.phone,language:u.language});
app.use(helmet());
app.use(cors({origin:process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : true}));
app.use(express.json({limit:'50kb'}));
app.use('/api',rateLimit({windowMs:60*1000,limit:150,standardHeaders:'draft-7',legacyHeaders:false}));
app.get('/',(_req,res)=>res.json({app:'RaahSetu',mode:'DEMO ONLY',docs:'/api'}));
app.get('/api',(_req,res)=>res.json({message:'RaahSetu demo API',warning:'No real SMS or emergency dispatch is performed',endpoints:['GET /api/health','POST /api/users','GET /api/users/:id','POST /api/contacts','GET /api/contacts?userId=','POST /api/contacts/:id/accept','POST /api/alerts','GET /api/alerts?userId=','POST /api/alerts/:id/acknowledge','POST /api/journeys','PATCH /api/journeys/:id','GET /api/cyber/guides','POST /api/evidence']}));
app.get('/api/health',(_req,res)=>res.json({success:true,message:'RaahSetu backend is running',mode:'demo',realSMS:false}));
app.post('/api/users',(req,res)=>{
 const {name,phone,language='en'}=req.body||{};
 if(typeof name!=='string'||name.trim().length<2||typeof phone!=='string'||!/^\+?[0-9]{10,15}$/.test(phone)||!['en','hi','bn','ta','te','mr'].includes(language))return fail(res,400,'Enter valid name, phone and supported language');
 const u={id:uid(),name:name.trim().slice(0,80),phone,language,createdAt:now()};db.users.push(u);persist();res.status(201).json({success:true,user:safeUser(u)});
});
app.get('/api/users/:id',(req,res)=>{const u=userById(req.params.id);if(!u)return fail(res,404,'User not found');res.json({success:true,user:safeUser(u)});});
app.post('/api/contacts',(req,res)=>{
 const {userId,name,phone}=req.body||{};
 if(!userById(userId))return fail(res,404,'User not found');
 if(typeof name!=='string'||!name.trim()||typeof phone!=='string'||!/^\+?[0-9]{10,15}$/.test(phone))return fail(res,400,'Valid contact name and phone required');
 if(db.contacts.filter(x=>x.userId===userId).length>=4)return fail(res,400,'Maximum four trusted contacts');
 const c={id:uid(),userId,name:name.trim().slice(0,80),phone,status:'pending',createdAt:now()};db.contacts.push(c);persist();res.status(201).json({success:true,contact:c,note:'Demo invitation only; no message was sent. Acceptance is simulated.'});
});
app.get('/api/contacts',(req,res)=>res.json({success:true,contacts:db.contacts.filter(c=>c.userId===req.query.userId)}));
app.post('/api/contacts/:id/accept',(req,res)=>{
 const c=db.contacts.find(x=>x.id===req.params.id);if(!c)return fail(res,404,'Contact not found');
 c.status='accepted';c.acceptedAt=now();persist();res.json({success:true,contact:c,note:'DEMO: acceptance is simulated, not identity-verified'});
});
function activateNext(alert){
 const contacts=accepted(alert.userId);
 if(alert.acknowledgedAt||alert.status==='exhausted')return;
 if(alert.contactIndex>=contacts.length){alert.status='exhausted';alert.events.push({type:'no_more_contacts',at:now()});return;}
 const c=contacts[alert.contactIndex];alert.status='notification_simulated';alert.nextEscalationAt=new Date(Date.now()+60000).toISOString();alert.events.push({type:'notification_simulated',contactId:c.id,contactName:c.name,at:now()});
}
app.post('/api/alerts',(req,res)=>{
 const {userId,latitude,longitude,locationSource='gps'}=req.body||{};
 if(!userById(userId))return fail(res,404,'User not found');
 if(typeof latitude!=='number'||typeof longitude!=='number'||latitude < -90||latitude > 90||longitude < -180||longitude > 180)return fail(res,400,'Valid numeric latitude and longitude required');
 const a={id:uid(),userId,latitude,longitude,locationSource,createdAt:now(),status:'created',contactIndex:0,acknowledgedAt:null,nextEscalationAt:null,events:[{type:'created',at:now()}]};db.alerts.push(a);activateNext(a);persist();res.status(201).json({success:true,alert:a,realMessageSent:false,warning:'DEMO ONLY: no real SMS was sent. Use 112 for emergencies in India.'});
});
app.get('/api/alerts',(req,res)=>res.json({success:true,alerts:db.alerts.filter(a=>a.userId===req.query.userId)}));
app.post('/api/alerts/:id/acknowledge',(req,res)=>{
 const a=db.alerts.find(x=>x.id===req.params.id);if(!a)return fail(res,404,'Alert not found');
 const c=accepted(a.userId)[a.contactIndex];
 if(!c||req.body?.contactId!==c.id)return fail(res,400,'Current contactId required for demo acknowledgment');
 if(a.acknowledgedAt)return fail(res,409,'Already acknowledged');
 a.acknowledgedAt=now();a.status='acknowledged';a.nextEscalationAt=null;a.events.push({type:'acknowledged_demo',contactId:c.id,at:now()});persist();res.json({success:true,alert:a,warning:'Demo acknowledgment is not authenticated'});
});
app.post('/api/journeys',(req,res)=>{
 const {userId,durationMinutes}=req.body||{};if(!userById(userId))return fail(res,404,'User not found');
 if(!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>1440)return fail(res,400,'durationMinutes must be 1 to 1440');
 const j={id:uid(),userId,status:'active',createdAt:now(),deadline:new Date(Date.now()+durationMinutes*60000).toISOString(),events:[]};db.journeys.push(j);persist();res.status(201).json({success:true,journey:j});
});
app.patch('/api/journeys/:id',(req,res)=>{
 const j=db.journeys.find(x=>x.id===req.params.id);if(!j)return fail(res,404,'Journey not found');
 if(!['active','missed'].includes(j.status))return fail(res,409,'Journey already closed');
 const action=req.body?.action;if(!['safe','extend','help'].includes(action))return fail(res,400,'action must be safe, extend or help');
 if(action==='safe')j.status='safe';if(action==='extend'){j.status='active';j.deadline=new Date(Date.now()+15*60000).toISOString();}if(action==='help')j.status='help_requested';
 j.events.push({action,at:now()});persist();res.json({success:true,journey:j,note:action==='help'?'Open SOS screen to create an actual demo alert':undefined});
});
app.get('/api/journeys',(req,res)=>res.json({success:true,journeys:db.journeys.filter(j=>j.userId===req.query.userId)}));
const guides=[
 {id:'abusive_messages',title:'Abusive messages',steps:['Do not reply to threats if it may increase danger.','Block and report the account.','Save screenshots if it is safe.']},
 {id:'blackmail',title:'Blackmail',steps:['Do not send money or more private material.','Save evidence if safe and tell someone you trust.','Use official reporting channels.']},
 {id:'payment_fraud',title:'Payment fraud',steps:['Contact your bank immediately.','Call 1930 in India for cyber financial fraud assistance.','Report at cybercrime.gov.in.']},
 {id:'hacked_account',title:'Hacked account',steps:['Use the official account recovery page.','Change passwords from a trusted device.','Enable two-factor authentication.']}
];
app.get('/api/cyber/guides',(_req,res)=>res.json({success:true,guides,reportingPortal:'https://cybercrime.gov.in/',cyberFraudHelpline:'1930'}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024},fileFilter:(_req,file,cb)=>cb(null,['image/png','image/jpeg','image/webp'].includes(file.mimetype))});
app.post('/api/evidence',upload.single('screenshot'),(req,res)=>{
 if(!userById(req.body?.userId))return fail(res,404,'User not found');
 if(!req.file)return fail(res,400,'Upload a PNG, JPEG or WebP screenshot under 2MB');
 const id=uid(),ext={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'}[req.file.mimetype];
 fs.writeFileSync(path.join(UPLOADS,id+ext),req.file.buffer,{flag:'wx'});
 const e={id,userId:req.body.userId,filename:id+ext,sha256:crypto.createHash('sha256').update(req.file.buffer).digest('hex'),uploadedAt:now(),size:req.file.size};db.evidence.push(e);persist();res.status(201).json({success:true,evidence:e,warning:'Local demo storage only. Do not upload sensitive real evidence.'});
});
app.use((err,_req,res,_next)=>{if(err instanceof multer.MulterError)return fail(res,400,err.message);console.error(err);return fail(res,500,'Unexpected server error');});
setInterval(()=>{
 let changed=false;
 for(const a of db.alerts){if(a.nextEscalationAt&&!a.acknowledgedAt&&Date.parse(a.nextEscalationAt)<=Date.now()){
 a.contactIndex++;a.nextEscalationAt=null;activateNext(a);changed=true;
 }}
 for(const j of db.journeys){if(j.status==='active'&&Date.parse(j.deadline)<=Date.now()){
 j.status='missed';j.events.push({action:'missed_checkin_demo',at:now()});changed=true;
 }}
 if(changed)persist();
},3000).unref();
app.listen(PORT,()=>console.log(`RaahSetu DEMO API: http://localhost:${PORT}/api/health`));
