var express = require('express');
var router = express.Router();
let request=require('then-request');
const crypto = require('crypto');
const querystring=require('querystring');
let  dbs;
const MongoClient=require('mongodb').MongoClient;
const url='mongodb://localhost:27017';//连接至某个库（db）
MongoClient.connect(url, {useNewUrlParser: true },function(err,db){//同步操作
    if(err) {console.error(err) ; return;};
    console.log("数据库已连接!");
    dbs=db;//
})

function addRecord(obj){
    if(!dbs) return;
    console.log('start insert');
    let dbase=dbs.db('user');//自动生成库和表
    let data=obj;
    dbase.collection('queryInfo').insertOne(data,(err,res)=>{
        if(err){console.error(err); return}
        console.log('insert success');
    })
}
const BaiduTranslatetUrl='http://api.fanyi.baidu.com/api/trans/vip/translate';
const APP_ID="20180604000171669";
const SEC_KEY="_hEUtRW3qu0XP1q5p0MK";

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('it it language');
  next();
});

router.get('/hot', function(req, res, next) {
    let hots=["你好","谢谢",'晚安','再见','我爱你','对不起'];
    let data={
        msg:"ok",
        data:hots
    }
    res.json(data);
    next();
});

router.get('/list', function(req, res, next) {
    let langs={
        "zh":"中文","en":"英语","jp":"日语","kor":"韩语","fra":"法语","spa":"西班牙语","th":"泰语","ara":"阿拉伯语","ru":"俄语","pt":"葡萄牙语","de":"德语","it":"意大利语","el":"希腊语","nl":"荷兰语","pl":"波兰语","bul":"保加利亚语","est":"爱沙尼亚语","dan":"丹麦语","fin":"芬兰语","cs":"捷克语","rom":"罗马尼亚语","slo":"斯洛文尼亚语","swe":"瑞典语","hu":"匈牙利语","cht":"繁体中文","vie":"越南语","yue":"粤语","wyw":"文言文"
    }
    let data={
        msg:"ok",
        data:langs
    }
    res.json(data);
    next();
});

router.post('/result', function(req, res, next) {
    let q=req.body.query;
    let langsStr=req.body.langs;
    console.log(`q is ${q} and  langsStr is ${langsStr}`);
    let aim=langsStr.split('&');
    let from='zh';
    //let aim=['en','jp','ru'];
    let promiseObjs=[];
    let rs=[];
    for(let lang of aim){
        let promiseItem=getSingleResult(q,from,lang);
        promiseObjs.push(promiseItem);
    }
    let data={
        query:q,
        langs:aim,
        date:new Date()
    }
    addRecord(data);
    Promise.all(promiseObjs).then(result=>{
        for(let singleRs of result){
            if(singleRs.statusCode==200){
                let userfulData=JSON.parse(singleRs.getBody('utf-8'))
                let word=userfulData.trans_result[0].dst;
               // console.log('userfulData is',userfulData);
                rs.push(word);
            }
        }
        let data={
            msg:"ok",
            data:rs
        }
        res.json(data);
    })
   // next();
});


function getTranslateFromBaidu(q){//从百度获取翻译结果
    let from='zh';
    let aim=['en','jp','ru'];
    let promiseObjs=[];
    let rs=[];
    for(let lang of aim){
        let promiseItem=getSingleResult(q,from,lang);
        promiseObjs.push(promiseItem);
    }
    Promise.all(promiseObjs).then(res=>{
        for(let singleRs of res){
            if(singleRs.statusCode==200){
                let userfulData=singleRs.getBody('utf-8')
                //console.log('userfulData is',userfulData);
                rs.push(userfulData);
            }
        }
        //console.log('final res is',rs);
    })
}

function getBody(encoding) {
    if (this.statusCode >= 300) {
        var err = new Error('Server responded with status code ' + this.statusCode + ':\n' + this.body.toString(encoding));
        err.statusCode = this.statusCode;
        err.headers = this.headers;
        err.body = this.body;
        throw err;
    }
    return encoding ? this.body.toString(encoding) : this.body;
}


function getSingleResult(q,from,to){//返回单个的promise
    let salt=Math.floor(Math.random()*100000);
    let sign = buildSign(q, APP_ID,salt, SEC_KEY);
    let params={// promise.all
        q:q,
        appid:APP_ID,
        salt:salt,
        from:from,
        to:to,
        sign:sign
    };
    let x=querystring.stringify(params);
    return  request('GET', `${BaiduTranslatetUrl}?${x}`, {
        // qs: querystring.stringify(params),
        // headers: {
        //     //"Content-Type": "application/json",
        // }
    })
    //     .then((result) => {
    //     //result 是个大对象 getBody获取body内容
    //
    //     //let body=result.body.toString('utf-8');
    //
    //     if(result.statusCode==200){
    //         //res.send(getOrderUrl(result.getBody('utf-8')));
    //         console.log(result.getBody('utf-8'));
    //         Promise.resolve(result.getBody('utf-8'));
    //
    //     }else{
    //         Promise.resolve();
    //         //return 'error';
    //         res.send('error');
    //     }
    // })
}


function buildSign(q,app_id,salt,sec_key){//获取签名
    let str=app_id+q.toString()+salt+sec_key;
    //console.log('str is ',str)
    let md5str=crypto.createHash('md5').update(str).digest('hex');
    //console.log(str,md5str);
    return md5str;
}

function addLog(){//记录用户的输入数据

}
//getTranslateFromBaidu('你好');
module.exports = router;
