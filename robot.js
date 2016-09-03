var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path')

/**
 *  @desc 爬虫类
 *
 *  @param object  obj          配置参数 
 *  @param string  obj.url      抓取网页地址URL
 *  @param string  obj.saveDir  抓取结果保存目录
 *  @param int     obj.mode     保存目录的权限
 *  @param boolean obj.debug    是否开启调试模式
 *  @param boolean obj.regex    是否开启正则表达式模式
 *  @param string  obj.regexExp 需抓取的正则表达式
 *  @param string  obj.cheerio  是否开启Cheerio模式
 */
var Robot = function(obj){

	this.url = obj.url || 'https://www.oschina.net/tweets';
	this.saveDir = obj.saveDir || 'C://oschina//net//';
	this.debug = obj.debug || false;
	this.regex = obj.regex || false;
	if(this.regex == true)
		this.regexExp = obj.regexExp;
	this.cheerio = obj.cheerio || false;
	this.mode = obj.mode || 0666;
}

/**
 * @desc 抓取方法
 *
 */

Robot.prototype.crawl = function(){

	var req;
	if(this.url.indexOf('https') > -1){
		req = https.request(this.url);
	}else{
		req = http = request(this.url);
	}
	var self = this;
	req.on('response',function(res){
		var data;
		res.on('data',function(chunk){
			data +=chunk;
		});
		res.on('end',function(){
			self.debug && console.log('抓取'+self.url+'成功!')
			self.successHandler(data);
		});
		res.on('error',function(e){
			self.debug && console.log('抓取'+self.url+'发生错误:'+e)
		})
	});

	req.on('error',function(e){
		self.debug && console.log('抓取'+self.url+'发生错误:'+e);
	})

	req.end();

}


/**
 *  @desc 请求成功处理方法
 *
 *  @param string  html          抓取网页内容 
 */
Robot.prototype.successHandler = function(html){
	if(!html)
		return '';
	var a=[];
	if(this.regex)
	    a = this.successHandlerByRegex(html);
	else if(this.cheerio)
		a = this.successHandlerByCheerio(html);
	else 
		throw new Error('请选择regex或cheerio模式');

	this.save(a);
}

/**
 *  @desc 正则处理方法
 *
 *  @param  string  html          抓取网页内容 
 *
 *  @return Array 			      返回抓取结果数组
 */
Robot.prototype.successHandlerByRegex = function(html){
	
	var regexExp;
	if(!this.regexExp || this.regexExp.length == 0){
		allRegex = [
			/<p class='txt'><a.*?href=['"]http:\/\/my.oschina.net\/(.*?)['"][^>]*>(.*?)<\/a>/gi,
		];
	}else{
		allRegex = this.regexExp;
	}
	var a = [];
	html = html.replace(/[\n\r\t]/g,'');
	for(var i = 0 ; i < allRegex.length ; i++){
		var ans;
		do{
			ans = allRegex[i].exec(html);
			if(ans){
				a.push(ans[2]);
			}
		}while(ans)

	}

	return a;
}

/**
 *  @desc Cheerio处理方法
 *
 *  @param  string  html          抓取网页内容 
 *
 *  @return Array 			      返回抓取结果数组
 */
Robot.prototype.successHandlerByCheerio = function(html){
	var $ = cheerio.load(html);
	var a = [];
	var exp;
	if(!this.cheerioExp || this.cheerioExp.length == 0)
		exp = "$('p.txt').children('a').each(function(index,elements){a.push(elements.children[0].data);});"; 
	else 
		exp = this.cheerioExp;
	eval(exp);
	return a;
}

/**
 *  @desc 保存结果数组至文件
 *
 *  @param  Array  elements          抓取网页结果数组 
 *
 */
Robot.prototype.save = function(elements){

	if(!elements || elements.length == 0)
		return;
	this.data = elements;
	var self = this;
	this.mkdirs(this.saveDir,this.mode,function(){
		var file = self.saveDir + "/1.txt";
		fs.writeFile(file,self.data,function(err){
			if(err) 
				self.debug && console.log(err);
		})
	});
	
}

/**
 *  @desc 正则处理方法
 *
 *  @param  string    dirname       创建的文件目录 
 *  @param  int       mode          创建的目录权限
 *  @param  function  callback      创建完成后的回调函数
 *
 */
Robot.prototype.mkdirs = function(dirname,mode,callback){
	
	var self = this;
	if(!dirname || dirname.length == 0) return;
	fs.exists(dirname,function(exists){
		if(exists){
			callback();
		}else{			
			self.mkdirs(path.dirname(dirname),mode,function(){
				fs.mkdir(dirname,mode,callback);
			})
		}
	})
}



module.exports = Robot;
