//liberries
//loading the spotify wrapper
var SpotifyWebApi = require('spotify-web-api-node');
//file reading 
var fs = require("fs");
//HTTP
const http = require("http");
const url = require("url")
const https = require("https");
//request
var req = require("request")
//async 
var async = require("async")
//removeAccents
var removeAccents = require("remove-accents")
//string compare 
var stringCompare = require("string-similarity")
//console input 
var readline = require('readline-sync');

/*
██    ██  █████  ██████  ███████
██    ██ ██   ██ ██   ██ ██
██    ██ ███████ ██████  ███████
 ██  ██  ██   ██ ██   ██      ██
  ████   ██   ██ ██   ██ ███████
*/





//variables 
var scopes = ['user-read-private', 'user-read-email'],
    redirectUri = 'http://localhost:8888/callback',
    clientId = '5ddacffa892542a08bd9927c226dad43',
    clientSecret = '45b90caa6aae43ddbd969bdc3982f5b4',
    state = 'some-state-of-my-choice',
    accessCode = ''.
    refreshCode = '';

//credentials for creation 
var credentials = {
    clientId : clientId,
    clientSecret : clientSecret,
    redirectUri : redirectUri
}

//temp code that was returned 
var code = ''

// creating the wrapper app 
var spotifyApi = new SpotifyWebApi(credentials);




/*
███████ ██    ██ ███    ██  ██████ ████████ ██  ██████  ███    ██ ███████
██      ██    ██ ████   ██ ██         ██    ██ ██    ██ ████   ██ ██
█████   ██    ██ ██ ██  ██ ██         ██    ██ ██    ██ ██ ██  ██ ███████
██      ██    ██ ██  ██ ██ ██         ██    ██ ██    ██ ██  ██ ██      ██
██       ██████  ██   ████  ██████    ██    ██  ██████  ██   ████ ███████
*/


//checking if the data file for spotify cred info exists 
function checkSpotifyDataFile(callback) {
  //checking file exists 
  fs.existsSync('spotifyData.json') ? loadSpotifyData(callback) : createSpotifyData()
}

//for when running for the first time 
//creating spotify data 
function createSpotifyData() {

  //get and print the url 
  // Create the authorization URL
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

  //console log url 
  console.log("The authorization URL is: \n")
  console.log(authorizeURL)
  console.log("\n")

  //starting the server 
  var server = http.createServer(function(request, response) {
    //responding on the page
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Thanks for authorizing, James!");

    //parsing the request url to get the code 
    //getting the url from request 
    //getting query from url 
    var queryData = url.parse(request.url, true).query;

    //getting code data from queryData
    code = queryData.code
    // console.log("\n\n" + code + "\n\n" )

    //need to get access and refresh codes with our new code 
    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code)
      .then(function(data) {
        // console.log('The token expires in ' + data.body['expires_in']);
        // console.log('The access token is ' + data.body['access_token']);
        // console.log('The refresh token is ' + data.body['refresh_token']);

        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        //storing access and refresh codes 
        accessCode = data.body['access_token']
        refreshCode = data.body['refresh_token']

        //writing to file 
        //storing in JSON
        var dataObject = JSON.stringify({accessCode : accessCode, refreshCode : refreshCode})
        fs.writeFile( "spotifyData.json", dataObject, "utf8", function(err) {
          if (!err) {
            console.log("\nSaved successfully\n")

          } else {
            console.log("\nNot saved successfully!\n")
          }

          //shutting down either way 
          // Shutting down! run again
          server.shutdown(function() {
            console.log('Everything is cleanly shutdown.');
            console.log("Run again!")
          });

        } );


      }, function(err) {
        console.log('Something went wrong!', err);
      });

    response.end();
    //and close the server either way 
    // server.close()


  })

  //for shutting down 
  server = require('http-shutdown')(server);

  //listening server 
  server.listen(8888)

}


//if it's already been run, load the data from the file 
function loadSpotifyData(callback) {
  // reading the saved spotify data 
  var spotData = require("./spotifyData.json");

  //data is already parsed 
  //read and store
  accessCode = spotData.accessCode
  refreshCode = spotData.refreshCode

  //set 
  spotifyApi.setAccessToken(accessCode);
  spotifyApi.setRefreshToken(refreshCode);

  //refreshing codes 
  // clientId, clientSecret and refreshToken has been set on the api object previous to this call.
  spotifyApi.refreshAccessToken()
    .then(function(data) {
      console.log('The access token has been refreshed!');

      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);

      //callback 
      callback && callback()
    }, function(err) {
      console.log('Could not refresh access token', err);
    });
}


//this function handles paging through all of the spotify api returns with 100 songs each
function getSongsHandler(tracksObj, user, id, index, max, callback, callbackFailure) {
  // Get tracks in a playlist from the index 
  spotifyApi.getPlaylistTracks(user, id, { 'offset' : index, 'fields' : 'items' })
    .then(function(data) {
      //push array to tracksObj
      for (let song of data.body.items) {
        tracksObj.push(song)
      }

      //return through callback if index >= max
      if (index >= max) {
        callback && callback(tracksObj)
      } else {
        //if the index < max there's still songs 
        //increment index and call function song 
        index += 100
        //call this function again 
        getSongsHandler(tracksObj, user, id, index, max, callback, callbackFailure)

      }


    }, function(err) {
      console.log('Something went wrong! in getSongsHandler', err);

      //callback failure 
      //if no playlist edm for some reason 
      //unncomment 
      callbackFailure && callbackFailure(err)
    });

}

//processing converting all the song objects to the string to search deezer with 
function handleSongStrings(tracksObj) {


  //variables 
  //array of songs + artists 
  var songsArr = []

  for (var i = 0; i < tracksObj.length; i++) {
    // console.log(tracksObj[i])
    var tempSearchName = ""
    //getting the two artist names 
    //storing temporarily 
    var tempArtistName = "";
    //need to loop through them 
    for (let iter of tracksObj[i].track.artists) {
      tempArtistName = tempArtistName.concat(iter.name + " ") 
    }
    
    //temp edited name to remove unicode characters 
    var tempEditedName = tracksObj[i].track.name + " " + tempArtistName
    tempEditedName = tempEditedName.replace(/["“‘”’’]/g, "'");
    tempEditedName = removeAccents.remove(tempEditedName)
    console.log(tempEditedName)

    //temp object that holds both normal song name and edited song name 
    var tempObj = {rawSongName: tracksObj[i].track.name, editedSongName: tempEditedName}

    //pushing to songsArr
    songsArr.push(tempObj)

  }
  
    return songsArr;

}

//get playlist specified in argument from user 
function getPlaylist(user, playlistName, callback) {

    //variables for this function 
    //id of the playlist 
    var playlistID;
    //how many songs there are, to page through them 
    var songCount;
    //the raw objects of individual tracks from the playlist
    var trackObjects = [];

    // Get my playlists user jolaroux
    spotifyApi.getUserPlaylists(user)
      .then(function(data) {
        // console.log('Retrieved playlists', data.body.items);
        // console.log(data.body.items.length)

        //get ID of playlist EDM
        for (let playlist of data.body.items) {
          //if it's the right playlist 
          if (playlist.name == playlistName) {
            //have the id of playlist now
            playlistID = playlist.id
            //have song count too 
            songCount = playlist.tracks.total
            console.log(songCount + " songs in playlist " + playlistName)

          }
        }


        //getting tracks in playlist
        //need to loop through songCount and call get100Songs until the playlist empty 
        var index = 0;
        //storing the song objects strings of song + artist
        var songObjects = [];
        //tracksObj, user, id, index, max, callback, callbackFailure
        getSongsHandler(trackObjects, user, playlistID, index, songCount, 

          //callback success
          function(trackObjects) {

            //formatting the strings to search deezer 
            songObjects = handleSongStrings(trackObjects)

            //printing for now 
            // for (let o of songObjects) {
            //   console.log(o)
            // }
            writeTo(songObjects, './spotifySongs.json')

            //pass back through callback 
            callback && callback(songObjects)

          }, 

          //callback failure
          function (err) {
            console.log(err)
          }
        )


      },function(err) {
        console.log('Something went wrong!', err);

        //callback failure 
        //if no playlist edm for some reason 
        //unncomment 
        callbackFailure && callbackFailure()

      });

}


//writes array to file sent
function writeTo(arr, file) {
  fs.writeFile(file, JSON.stringify(arr), 'utf8',  function(err) {
    if (err) {
      console.log(err)
    }

  })
}

//this searches deezer using an HTTP GET 
function searchDeezer(searchString, callback) {
  console.log("")
  //url is 
  //https://api.deezer.com/search?q=eminem
  var searchUrl = "https://api.deezer.com/search?q=";
  //add in searchString
  var newSearchUrl = searchUrl + searchString.editedSongName
  //remove unicode stupid fucking quotes 
  newSearchUrl.replace(/["“‘”’]/g, "'");
  newSearchUrl = removeAccents.remove(newSearchUrl)
  
  //error or not 
  var err = false;
  //no match or not 
  var noMatch = false;
  //data from search 
  var data;
  var title;
  //full data of object 
  var fulldata;
  //comparing two strings result 
  var sComparePercent
  
  
  console.log(newSearchUrl)
  
  //try and catch because fuck this shit 
  try {
      //searching
      req.get(newSearchUrl, (error, response, body) => {
        
        //full data 
        fulldata = ""

        //parsing 
        let json = JSON.parse(body);

        //has data and total 
        //if there's no search result 
        if (json.total == 0) {
          // console.log("No results for " + searchString)
          data = searchString
          noMatch = true
        } else {
          //storing data from track object
          title = json.data[0].title
          data = json.data[0].link
          fulldata = json.data[0]
          // console.log(fulldata)
          
          //comparing strings
          sComparePercent = stringCompare.compareTwoStrings(title, searchString.rawSongName)
          // console.log("Comparing: ")
          // console.log(title + "\nand\n" + searchString.rawSongName)
          
        }
        // console.log(data);
        // let item = {index: index, json: json}
      
        callback && callback(data, title, searchString.editedSongName, sComparePercent, noMatch, fulldata, err)
      });
  } catch (e) {
    console.log("ERROR")
    console.log(e)
    callback && callback(data, fulldata, noMatch, e)
  }
  

  
}


//this handles searching deezer for all the songs 
function handleDeezer(songs) {
  
  //TEMPORARY 
  //loading the songs from spotifySongs.txt 
  // var songs = require('./spotifySongs2.json')

  
  //variables 
  var index = 0
  //songs from deezer 
  var deezSongs = {}
  var deezSongsArr = []
  //songs with no match 
  var noMatches = {}
  var noMatchesArr = []
  //songs that errored 
  var errorSongs = {}


  
  //async calling it 
  async.forEachOfSeries(songs, 
    //run with every item 
    function(value, key, callback) {
      

      //call the searchDeezer function 
      searchDeezer(value, function(link, title, origTitle, comparePercent, noMatch, fulldata, err) {
        //if it succeeded in searching 
        if (!err) {
          //if there WAS a match
          if (!noMatch) {
            //setting 
            deezSongs[key] = {link: link, origTitle: origTitle, title: title, artist: fulldata.artist.name, percent: comparePercent}
            deezSongsArr.push({link: link, origTitle: origTitle, title: title, artist: fulldata.artist.name, percent: comparePercent})

          } else {
            //if it did NOT have a match
            // noMatches.push(title)
            noMatches[key] = origTitle
            noMatchesArr.push({origTitle: origTitle})
          }
        } else {
          //if it ERRORED 
          // errorSongs.push(title)
          errorSongs[key] = origTitle
        }
        
        //calling back so async knows
        callback()
      })
      
    }, 
    //called when everything is done or if there's an error 
    function() {
      
      //going through all the songs that have matches one by one and choosing whether to 
      //download that one or not.
      //need to print the given name and the return title + artist and a yes / no option 
      //var name = readline.question("What is your name?");
      // syntax for reading input ^
      
      //object to store the YES songs in 
      yesSongsToDownload = []
      //object to store NO's in 
      noSongsToDownload = []
      

      
      //figuring out whether to download each song or not!
      for (let song of deezSongsArr) {
        //get input for each song 
        // string to ask in the question 
        var promptString = "\n\nGiven: \n\t" + song.origTitle + "\n" + "Deezer Search: \n\t" + song.title + " " + song.artist  +"\nEnter to download, anything else to skip:\n"
        var toDownload = readline.question(promptString)
        
        //seeing if we should download the song or not 
        if (toDownload.length == 0) {
          //add to yesSongsToDownload
          yesSongsToDownload.push(song)
        } else {
          noSongsToDownload.push(song)
        }
      }
      
      //adding all the no matches to noSongsToDownload 
      noSongsToDownload = noSongsToDownload.concat(noMatches)
      
      //can now export a file of links of songs to download 
      //need to make a string of all the links to write to the file 
      var largeString = ""
      //filling the string 
      for (let song of yesSongsToDownload) {
        largeString = largeString + song.link + "\n"
      }

      //writing to the file!
      fs.writeFile("DeezerDownloadLinks.txt", largeString, 'utf8',  function(err) {
        if (err) {
          console.log(err)
        }

      })
      
      //now do the same with all the no matches 
      var largeNoMatchString = ""
      //filling the string 
      for (let song of noSongsToDownload) {
        largeNoMatchString = largeNoMatchString + song.origTitle + "\n"
      }
      
      //writing to the file!
      fs.writeFile("DeezerNOMatches.txt", largeNoMatchString, 'utf8',  function(err) {
        if (err) {
          console.log(err)
        }

      })
      
      
      /*
      //logging the matched songs 
      console.log("MATCHES FOR:")
      console.log(deezSongs)
      console.log("\n\n")

      //logging errors 
      console.log("ERROR FOR:")
      console.log(errorSongs)
      console.log("\n\n")

      //logging no matches 
      console.log("NO MATCHES FOR:")
      console.log(noMatches)
      */
    }
  )
  
}





/*
███    ███  █████  ██ ███    ██
████  ████ ██   ██ ██ ████   ██
██ ████ ██ ███████ ██ ██ ██  ██
██  ██  ██ ██   ██ ██ ██  ██ ██
██      ██ ██   ██ ██ ██   ████
*/


//getting the process started of checking if the data exists or not 
//if it doesn't then it's created and saved and if it does it's loaded 
//call the next function with callback
//UNCOMMENT
checkSpotifyDataFile(function() {

    //getting the playlist xxx 
    getPlaylist('jolaroux', /*'rap'*/ 'EDM', function(songsArr) {
      //callback success with array of edited songs 
      handleDeezer(songsArr)
    })

    //deezer's api 
    // handleDeezer()


})

// handleDeezer()