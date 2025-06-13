<?php
/************************************************************************************
Website Job Creation:

insert into tblDredgeWorkerJob (
workJobID,workURL,workAction,WorkStatus,workVPWidth,workVPHeight,workPayment,workUAgent)
select websiteID,concat(prot,'://',URL),'fetchWScrShot','newjob',1200,800,10.0,
'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0'
from tblWebsites 
where mrkDelete is null and responseCD is null
limit 100

YouTube Chan Recreate 

truncate table tblDredgeJob

delete tblDredgeWorkerJob from tblDredgeWorkerJob
left join tblDredgeJob on dredID = workJobID
where  dredID is null and  workMUID is null and workAction='dredgeVid' 

====================================================================================
*/

include_once('../mkysess.php');

$json = file_get_contents('php://input');

$data = json_decode($json);

if(!$data){
  fail("JSON Parsing Error Detected.. No work completed");
}

$workerID = clean($data->workerID);
$jobType  = clean($data->jobType);
$jobType = null;

if ($jobType){
  $jobType = " and workAction = '".$jobType."' ";
}

$pollRate = 30;
//fail("No work right now");

checkWorkerAccount($workerID);

$SQL = "select firstname, timestampdiff(second,dnodLastJob,now()) lastJob from tblwzUser ";
$SQL .= "left join tblDredgeNode on dnodMUID = mbrMUID ";
$SQL .= "where mbrMUID = '".$workerID."'";

$res = mkyMsqry($SQL);
$rec = mkyMsFetch($res);

if ($rec){
  if ($rec['lastJob'] < $pollRate){
    fail("No work right now");
  }
  $SQL = "update tblDredgeNode set dnodLastJob = now() where dnodMUID = '".$workerID."'";
  mkyMsqry($SQL);

  $work = getWork($workerID);
  respond("Hello ".$rec['firstname']." Welcome Back.",true,$work);
}
fail('No Worker Record Found');

function checkWorkerAccount($workerID){
  $SQL = "select dnodID,dnodAddress from tblwzUser ";
  $SQL .= "left join tblDredgeNode on dnodMUID = mbrMUID ";
  $SQL .= "where mbrMUID = '".$workerID."'";
  $res = mkyMsqry($SQL);
  $rec = mkyMsFetch($res);
  $IP = getIPAddress();
  if ($rec){
    if (is_null($rec['dnodID'])){
      $SQL = "insert into tblDredgeNode (dnodAddress,dnodNetwork,dnodMUID,dnodLastJob) ";
      $SQL .= "values ('".$IP."','mkyNanoBot','".$workerID."',date_add(now(),INTERVAL -60 second))";
      if (mkyMsqry($SQL)){
        return true;
      }
      return false;
    }
    if ($IP != $rec['dnodAddress']){
      $SQL = "update tblDredgeNode set dnodAddress = '".$IP."' where dnodID = ".$rec['dnodID'];
      mkyMsqry($SQL);
    }
    return true;
  }
  return false;
}
function getIPAddress() {  
  if (!empty($_SERVER['HTTP_CLIENT_IP'])) {  
    $ip = $_SERVER['HTTP_CLIENT_IP'];  
   }  
   elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {  
     $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];  
   }  
   else {  
     $ip = $_SERVER['REMOTE_ADDR'];  
   }  
   return $ip;  
}  
function getWork($muid){
  $j = new stdClass;
  $j->pRate  = $GLOBALS['pollRate'];
  $j->workID = null;
  $j->action = null;
  $j->subCmd = null;
  $j->url = null;
  $j->uAgent = null;
  $j->width = 1280;
  $j->height = 800;
  $j->payment = null;  
  $j->queID = null;
  $j->jobID = null;


  $SQL = "select * from tblDredgeWorkerJob where workMUID is null and workSubCmd='createYTChan' order by rand() limit 1";
  $res = mkyMyqry($SQL);
  $rec = mkyMyFetch($res);
  if (!$rec){
    $SQL = "select * from tblDredgeWorkerJob where workMUID is null and workSubCmd='createChanList' order by rand() limit 1";
    $res = mkyMyqry($SQL);
    $rec = mkyMyFetch($res);
  }
  if (!$rec){
    $SQL = "select * from tblDredgeWorkerJob where workMUID is null and workAction='dredgeVid' order by rand() limit 1";
    $res = mkyMyqry($SQL);
    $rec = mkyMyFetch($res);
  }
  if (!$rec){
    $SQL = "select * from tblDredgeWorkerJob where workMUID is null and (workSubCmd is null or not workSubCmd='markVideoRespCD') order by rand() limit 1";
    $res = mkyMyqry($SQL);
    $rec = mkyMyFetch($res);
  }
  if (!$rec){
    $SQL = "select * from tblDredgeWorkerJob where workMUID is null and workSubCmd='markVideoRespCD' order by rand() limit 1";
    $res = mkyMyqry($SQL);
    $rec = mkyMyFetch($res);
  }
  if (!$rec){
    respond("No Work To Do... Try later",false,$j);
  }
  if (!mkyStartTransaction()){
    tranFail();
  }
  $SQL = "update tblDredgeWorkerJob set workMUID='".$muid."',workStatus = 'selected',workStarted=now() where workID = ".$rec['workID'];
  if(!mkyMsqry($SQL)){
    tranFail();
  }
  if(!mkyCommit()){
    tranFail();
  }
  $j->workID = $rec['workID'];
  $j->action = $rec['workAction'];
  $j->subCmd = $rec['workSubCmd'];
  $j->url    = $rec['workURL'];
  $j->queID  = $rec['workQueID'];
  $j->uAgent = $rec['workUAgent'];
  $j->width  = $rec['workVPWidth'];
  $j->height = $rec['workVPHeight'];
  $j->payment = $rec['workPayment'];
  $j->queID   = $rec['workQueID'];
  $j->jobID   = $rec['workJobID'];
  return $j;
}
function respond($msg,$result,$work){
  fail($msg,$result,$work); 
}
function tranFail($msg='Transaction Failed... try later'){
  mkyRollback();
  fail($msg);
}
function fail($msg,$result=false,$work=null){
  $j = new stdClass;
  $j->result = $result;
  $j->msg = $msg;
  $j->work = $work;
  $j->pRate = $GLOBALS['pollRate'];
  exit(json_encode($j));
}
?>
