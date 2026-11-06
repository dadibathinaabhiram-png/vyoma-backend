import test from 'node:test';import assert from 'node:assert/strict';import {dueFestivals} from '../src/festivals.js';
test('sends only at local hour on festival date',()=>{
 const f=[{id:'x',name:'Example',date:'2026-11-06',message:'Greetings'}];
 const u={timeZone:'Asia/Kolkata',region:'IN-AP',sendHour:9};
 assert.equal(dueFestivals(f,u,new Date('2026-11-06T03:30:00Z')).length,1);
 assert.equal(dueFestivals(f,u,new Date('2026-11-06T02:30:00Z')).length,0);
});
