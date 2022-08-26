const playwright = require('playwright');
const fs = require('fs');

var request = require('request');
var wID = null;
var sKey = null;
var jID  = null;
var pRate = 5;
var timer = null;

try {
  let rawdata = fs.readFileSync('config.json');
  let cred = JSON.parse(rawdata);
  login(cred.user,cred.passw);
}
catch(er){
  console.log('config.json file not found or invalid');
}

function getWork(){
  var pJ = {
    workerID: wID,
    jobType: 'dredgeVid'
  }
  request.post({
    headers: {'content-type' : 'application/json'},
    uri: 'https://www.bitmonky.com/whzon/dredge/dredgeGetWork.php',
    json: pJ
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(response.statusCode);
 	try {
 	  j = body;
          jID = j.workID;
	  if (pRate != j.pRate){      
	    pRate = j.pRate;
            console.log('Changing Poll Rate To: ',j.pRate);
	  }
          if (j.result){  
	    if(j.work.action == 'fetchWScrShot'){
              console.log(j);
              fetchWScrShot(j);
            } 
	    else if(j.work.action == 'fetchDoc'){
              console.log(j);
              fetchDoc(j);
            }
            else if(j.work.action == 'dredgeVid'){
              console.log(j);
              dredgeYT(j);
            }
            else {
	      console.log('Action Not Found: ',j.work.action);
              pollForWork();
	    }
          }
          else {
            console.log(j.msg);
            pollForWork();
	  }
        } 
        catch (err) { 
	  console.log('Get Work Error: ',err)
          pollForWork();
	}
      } 
      else {
	console.log('Error',error);
        pollForWork();
      }
    }
  );
}
function pollForWork(){
  console.log("Waiting For More Work");
  clearTimeout(timer);
  timer = setTimeout( ()=>{
    getWork();
  },pRate*1000);
}
function postWork(j){
  j.sKey = sKey;
  j.wID  = wID;
  j.version = "nanbot1.0";

  console.log('Posting Work: ');
  request.post({
    headers: {'content-type' : 'application/json'},
    uri: 'https://www.bitmonky.com/whzon/dredge/dredgePostWork.php',
    json: j
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('Post Work Response: ',response.statusCode);
        console.log('message: ',body);
        pollForWork();
      }
      else {
	console.log('Post Work Error');
        pollForWork();
      }
    });
}
async function login(uid,password){
  wID = await doLogin(uid,password);
  console.log(wID);
  var j = null;
  try { 
    j = JSON.parse(wID);
    if (j.result == "OK"){
      wID  = j.MUID;
      sKey = j.token;
      console.log('logged In As: ' + wID);
      console.log('Session Key: ' + sKey);
      getWork();
    }	    
    else {
      console.log('Login Failed');
    }
  }
  catch(err){console.log('LoginFailed - JSON parse error:',wID);}
}  
async function doLogin(uid,password){
  return new Promise(async(resolve,reject)=>{
    var result = null;
    await request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url: 'https://www.gogominer.com/whzon/mbr/nanoLogin.php',
    body: 'femail='+uid+'&fpassword='+password
    },
    await function (error, response, body) {
        if (!error && response.statusCode == 200) {
          result = body;	     
        } 
        else {
      	  result = response.statusCode;
	}
        resolve (result);
    });
  });	
}
async function dredgeYT(J) {
  console.log('try fetching :',J.work.url);
  var j = null;
  try {
    const browser = await playwright.chromium.launch({
      headless: true // set this to true
    });
    var presult = false;
    const page = await browser.newPage({ userAgent: J.work.uAgent });
    await page.setViewportSize({ width: parseInt(J.work.width), height: parseInt(J.work.height) }); // set screen shot dimention
    var hres = await page.goto('https://youtube.com/watch?v='+J.work.url);
    if (hres){
      console.log("Status: ", hres.status());
      if (hres.status() == 200){
        presult = true;
      }
    }

    if (presult){
      var html = await page.content();
      console.log('html:'+typeof(html));
      html = html.replace(/'/g,"\"");
      html = html.replace(/\/>/g,">");
      html = html.replace(/ >/g,">");
      html = html.replace(/< /g,"<");
      html = html.replace(/\n/g," ");
      //html  = trim(preg_replace('/\s\s+/', ' ', html));

      var response = hres.status();
      if (html.indexOf('"simpleText":"This video has been removed by the uploader"') > 0){
        response = 304;
      }
      j  = {
        result   : presult,
        response : response,
        job      : J,
        title    : sGetTag('"title":"','",',html),
        chanID   : sGetTag('"channelId":"','"',html),
        pDate    : sGetTag('"publishDate":"','"',html),
        author   : sGetTag('"author":"','",',html),
        channel  : sGetTag('"ownerChannelName":"','",',html),
        desc     : sGetTag('"shortDescription":"','",',html)
      };
      postWork(j);
    }
    else {
      postWork({result:false,response:hres.status(),job:J});
    }
    //await page.screenshot({ path: 'my_screenshot.png' })
    await browser.close();
  }
  catch(er){
    j = {
      result   : false,
      job      : J,
      response : 000
    }
  }      
  postWork(j);    
}
async function fetchDoc(J) {
  console.log('try fetching :',J.work.url);
  var j = null;
  try {
    let domain = (new URL(J.work.url));
    domain = domain.hostname;
    const browser = await playwright.chromium.launch({
      headless: true // set this to true
    });
    //const page = await browser.newPage({ userAgent: J.uAgent});
    const page = await browser.newPage(
    { userAgent: J.work.uAgent,
      storageState: {cookies:[{name:"CONSENT",value:"PENDING+999",domain:domain,path:"/"}]}
    });
  
    await page.setViewportSize({ width: parseInt(J.work.width), height: parseInt(J.work.height) });
    var hres = await page.goto(J.work.url);
    var presult = false;
    if (hres){
      console.log("Status: ", hres.status());
      if (hres.status() == 200){
        presult = true;
      }
    }
    var html = await page.content();

    j  = {
      result   : presult,
      job      : J,
      response : hres.status(),
      html     : html
    };
    await browser.close();
  }
  catch(er){
    j = {
      result   : false,
      job      : J,
      response : 000
    }
  }      
  postWork(j);
}
async function fetchWScrShot(J,res=null) {
  var domain = null;
  try {
    domain =  new URL(J.work.url);
  }
  catch(er) {
    console.log('INVALID URL',J.work.url);
    return;
  }
  domain = domain.hostname;
  const browser = await playwright.chromium.launch({
    headless: true
  });
  const page = await browser.newPage(
  { userAgent: J.uAgent,
    storageState: {cookies:[{name:"CONSENT",value:"PENDING+999",domain:domain,path:"/"}]}
  });
  var hres = null;
  var scrshot = null;
  try {
    await page.setDefaultTimeout(300000);
    await page.setViewportSize({ width: 1280, height: 800 }); // set screen shot dimention
    var hres = await getPage(page,J.work.url);
  }
  catch(er){
    console.log('Failed To Fetch Document');
  } 
  if (!hres){
    var j  = {
      result   : false,
      mFound   : false,
      job      : J,
      response : 999,
      data     : null,
      scrshot  : null,
      title    : null,
      desc     : null,
      ogImg    : null,
      furl     : null
    };
    await browser.close()
    postWork(j);
  }
  else {
    var takeshot = null;
    var scrShot  = null;
    try {
      takeshot = await page.screenshot();
      scrshot = takeshot.toString('base64');
      console.log("scrshot: length: ",scrshot.toString('base64').length);
    }
    catch(er) {console.log('Screen Shot Failed');}
  
    var presult = false;
    var rstatus = '999';

    console.log("Status: ", hres.status());
    if (hres.status() == 200 ){
      presult = true;
    }
    rstatus = hres.status();

    console.log ('Page ResponseCode: ',rstatus);

    //await page.waitForTimeout(5000);
    var title = null;
    var title = null;
    try {title = await page.title();}
    catch(er){
      console.log('page.title failed');
      title="Title Not Found...";
    }
    console.log('title',title);
    const furl = await page.url();
    console.log('Final URL:',furl);

    const data = await page.evaluate(() => {
      try {
        const metas = document.querySelectorAll("meta");
        const mname     = Array.from(metas).map((v) => v.name);
        const mcontent  = Array.from(metas).map((v) => v.content);
        const mTag = Array.from(metas).map((v) => v.outerHTML);
        const images = document.querySelectorAll("img");
        const urls = Array.from(images).map((v) => v.src);
        const height  = Array.from(images).map((v) => v.height);
        const widths  = Array.from(images).map((v) => v.width);
        return {urls : urls,h:height,w:widths,mname:mname,mcontent:mcontent,mTag:mTag} ;
      }
      catch(er) {
        return {urls : null,h:null,w:null,mname:null,mcontent:null,mTag:null} ;
      }  
    });
 

    var desc = null;

    var fdata = null;
    if (typeof data !== 'undefined'){
      fdata = data;
      desc = getMetaDesc(data);
      console.log("Description: ",desc);
    
      if (!title || title==''){
        title = getOgTitle(data);
      }
      //var html = await page.content();
    }
    var metaFound = true;
    if (!title || title == '' || !desc || desc == ''){
      scrshot = "empty";
      metaFound  = false;
      console.log("No info: nulling screen shot",scrshot);
    }

    var j  = {
      result   : presult,
      mFound   : metaFound,
      job      : J,
      response : rstatus,
      data     : fdata,
      scrshot  : scrshot,
      title    : rawUrlEncode(title),
      desc     : rawUrlEncode(desc),
      ogImg    : rawUrlEncode(getMetaContent(fdata,'og:image')),
      furl     : rawUrlEncode(furl)
    };
    console.log('og:image ->',j.ogImg);
    await browser.close()
    postWork(j);
  }
}
function getPage(page, url) {
  var res = null;
  return new Promise(async(resolve,reject)=>{
    try {
      res = await page.goto(url, {
        timeout: 300 * 1000,
        waitUntil: 'load',
      });
      resolve(res);
    }
    catch(er){
      console.log("myERROR:",er);
      resolve(res);
    }
  });
}
function getMetaContent(j,str){
  if ( typeof j === 'undefined'){
    return null;
  }
  if (!j){return;}	
  var descIndex = null;
  if (typeof j.mTag === 'undefined'){
    return null;
  }
  j.mTag.forEach((item,index)=>{
    var name = item.toLowerCase();
    if (name.indexOf(str) > 0){
      descIndex = index;
    }
  });
  if (descIndex){
    return j.mcontent[descIndex];
  }
  return null;
}
function getOgTitle(j){
  var descIndex = null;
  if (typeof j.mTag === 'undefined'){
    return "";
  }
  j.mTag.forEach((item,index)=>{
    var name = item.toLowerCase();
    if (name.indexOf('og:title') > 0){
      descIndex = index;
    }
  });
  if (descIndex){
    return j.mcontent[descIndex];
  }
  return "";
}
function getMetaDesc(j){
  console.log("j.mname: ",typeof j.mname);
  var descIndex = null;
  if (typeof j.mname !== 'undefined'){
    j.mname.forEach((item,index)=>{
      var name = item.toLowerCase();
      if (name == 'description'){
         descIndex = index;
      }
    });
    if (descIndex){
      return j.mcontent[descIndex];
    }
  }
  if (typeof j.mTag !== 'undefined'){
    j.mTag.forEach((item,index)=>{
      var name = item.toLowerCase();
      if (name.indexOf('og:description') > 0){
        descIndex = index;
      }
    });
    if (descIndex){
      return j.mcontent[descIndex];
    }
  }
  return "No Description Found...";
}
function rawUrlEncode(str) {
    if (!str){
      return str;
    }
    str = str.replace(/[\"\']/gm, '`');
    str = str.replace(/[{}<>]/gm, '');
    str = str.replace(/[\r\n]/gm, ' ');
    str = addslashes(str);
    console.log(str);
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}
function addslashes( str ) {  
    // Escapes single quote, double quotes and backslash characters in a string with backslashes    
    // *     example 1: addslashes("kevin's birthday");  
    // *     returns 1: 'kevin\'s birthday'  
   
    return (str+'').replace(/([\\"'])/g, "\\$1").replace(/\0/g, "\\0");  
} 
function sGetTag(s,e,doc){
  spos = doc.indexOf(s);
  console.log('start: ',spos);
  if (spos < 0){
    return null;
  }
  spos = spos + s.length;
  tag = right(doc,spos);

  epos = tag.indexOf(e);

  console.log('End: ',epos);
  if (epos < 0){
    console.log('End Tag Not Found: ',e);
    fs.writeFileSync("erlog.txt", tag);
    return null;
  }
  tag = left(tag,epos);
  if (tag == '' || tag ==  ' '){
   return null;
  }
  return tag;
}
function right(str, chr) {
  return str.slice(chr,str.length);
}
function left(str, chr) {
  return str.slice(0, chr);
}

