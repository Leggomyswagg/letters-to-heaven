import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';

const app=express();
app.use(express.json({limit:'64kb'}));
app.post('/api/reflect',async(req,res)=>{
  const {text='',name=''}=req.body||{};
  if(!text.trim()) return res.status(400).json({error:'Draft is required.'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'AI helper is not configured.'});
  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const r=await client.responses.create({model:'gpt-5.6-luna',input:[
      {role:'system',content:'You are a gentle grief-writing companion. Help the writer find their own words. Do not invent memories or facts. Preserve their voice. Return only a lightly polished version of their draft, with no preamble.'},
      {role:'user',content:`I am writing to ${name||'someone I miss'}. Here is my draft:\n\n${text}`}
    ]});
    res.json({text:r.output_text});
  }catch(err){console.error(err);res.status(500).json({error:'The reflection helper could not respond.'});}
});
const port=process.env.PORT||3001;
app.listen(port,()=>console.log(`Letters to Heaven API listening on ${port}`));
