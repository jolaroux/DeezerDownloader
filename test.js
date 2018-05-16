//https://api.deezer.com/search?q=We’re All We Need - ilan Bluestone Remix ABGT Mix Above & Beyond Zoe Johnston 
var req = require("request")
const https = require("https")

// var url = "https://api.deezer.com/search?q=Were All We Need - ilan Bluestone Remix ABGT Mix Above & Beyond Zoe Johnston"
// 
// https.get(url, res => {
//   res.setEncoding("utf8");
//   let body = "";
//   res.on("data", data => {
//     body += data;
//   });
//   res.on("end", () => {
//     body = JSON.parse(body);
//     console.log(
//       body
//     );
//   });
// });

//this searches deezer using an HTTP GET 
function searchDeezer() {
  
  //url is 
  //https://api.deezer.com/search?q=eminem
  var searchUrl2 = "https://api.deezer.com/search?q=We're All We Need - ilan Bluestone Remix ABGT Mix Above & Beyond"
  var searchUrl = "https://api.deezer.com/search?q=We’re All We Need - ilan Bluestone Remix ABGT Mix Above & Beyond Zoe Johnston "
  searchUrl = searchUrl.replace(/["“‘”’]/g, "'");
  console.log(searchUrl)
  //error or not 
  var err = false;
  
  //data from search 
  var data;
  
  
  // console.log(searchUrl + searchString)
  console.log("")
  //searching
  req.get({url:searchUrl, headers:{ 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'}}, (error, response, body) => {
    console.log(error)
    // console.log(response)
    // console.log(body)
    var fulldata = ""
    
    console.log("BEFORE PARSING")
    console.log("\n\n" + body + "\n\n")
    //parsing 
    let json = JSON.parse(body);
    console.log("AFTER PARSING")
    //has data and total 
    //if there's no search result 
    if (json.total == 0) {
      // console.log("No results for " + searchString)
      data = searchString
      err = true
    } else {
      data = json.data[0].title
      fulldata = json.data[0]
    }
    // console.log(data);
    // let item = {index: index, json: json}
  
    // callback && callback(data, fulldata, err)
  });
  
}


// searchDeezer()


var test = require('./spotifySongs.json')

for (var i = 0; i < test.length; i++) {
  console.log(i + " " + test[i])
}