//liberries
//loading the spotify wrapper
var SpotifyWebApi = require('spotify-web-api-node');
//file reading 
var fs = require("fs");
//removeAccents
var removeAccents = require("remove-accents")

/*****************************
This "class" handles getting the spotify account set up,
and getting the song information for a given playlist
*****************************/

"use strict";

// the "class" itself 
//base class, no extends
class HandleSpotify{
    //constructor is literally named constructor for some reason 
    constructor() {
        
        //variables 
        this.scopes = ['user-read-private', 'user-read-email'],
            this.redirectUri = 'http://localhost:8888/callback',
            this.clientId = '5ddacffa892542a08bd9927c226dad43',
            this.clientSecret = '45b90caa6aae43ddbd969bdc3982f5b4',
            this.state = 'some-state-of-my-choice',
            this.accessCode = '',
            this.refreshCode = '';

        //credentials for creation 
        this.credentials = {
            clientId : this.clientId,
            clientSecret : this.clientSecret,
            redirectUri : this.redirectUri
        }

        //temp code that was returned 
        this.code = ''

        // creating the wrapper app 
        this.spotifyApi = new SpotifyWebApi(this.credentials);
    }
    
    
    
    
    //checking if the data file for spotify cred info exists 
    checkSpotifyDataFile(callback) {
      //checking file exists 
      fs.existsSync('spotifyData.json') ? this.loadSpotifyData(callback) : this.createSpotifyData()
    }

    //for when running for the first time 
    //creating spotify data 
    createSpotifyData() {

      //get and print the url 
      // Create the authorization URL
      this.authorizeURL = this.spotifyApi.createAuthorizeURL(scopes, state);

      //console log url 
      console.log("The authorization URL is: \n")
      console.log(authorizeURL)
      console.log("\n")

      //starting the server 
      this.server = http.createServer(function(request, response) {
        //responding on the page
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write("Thanks for authorizing, James!");

        //parsing the request url to get the code 
        //getting the url from request 
        //getting query from url 
        this.queryData = url.parse(request.url, true).query;

        //getting code data from queryData
        code = queryData.code
        // console.log("\n\n" + code + "\n\n" )

        //need to get access and refresh codes with our new code 
        // Retrieve an access token and a refresh token
        this.spotifyApi.authorizationCodeGrant(code)
          .then(function(data) {
            // console.log('The token expires in ' + data.body['expires_in']);
            // console.log('The access token is ' + data.body['access_token']);
            // console.log('The refresh token is ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            this.spotifyApi.setAccessToken(data.body['access_token']);
            this.spotifyApi.setRefreshToken(data.body['refresh_token']);

            //storing access and refresh codes 
            this.accessCode = data.body['access_token']
            this.refreshCode = data.body['refresh_token']

            //writing to file 
            //storing in JSON
            this.dataObject = JSON.stringify({accessCode : accessCode, refreshCode : refreshCode})
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


          }.bind(this), function(err) {
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
    loadSpotifyData(callback) {
      // reading the saved spotify data 
      this.spotData = require("./spotifyData.json");

      //data is already parsed 
      //read and store
      this.accessCode = this.spotData.accessCode
      this.refreshCode = this.spotData.refreshCode

      //set 
      this.spotifyApi.setAccessToken(this.accessCode);
      this.spotifyApi.setRefreshToken(this.refreshCode);

      //refreshing codes 
      // clientId, clientSecret and refreshToken has been set on the api object previous to this call.
      this.spotifyApi.refreshAccessToken()
        .then(function(data) {
          console.log('The access token has been refreshed!');

          // Save the access token so that it's used in future calls
          this.spotifyApi.setAccessToken(data.body['access_token']);

          //callback 
          callback && callback()
        }.bind(this), function(err) {
          console.log('Could not refresh access token', err);
        });
    }


    //this function handles paging through all of the spotify api returns with 100 songs each
    getSongsHandler(tracksObj, user, id, index, max, callback, callbackFailure) {
      // Get tracks in a playlist from the index 
      this.spotifyApi.getPlaylistTracks(user, id, { 'offset' : index, 'fields' : 'items' })
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
            this.getSongsHandler(tracksObj, user, id, index, max, callback, callbackFailure)

          }


        }.bind(this), function(err) {
          console.log('Something went wrong! in getSongsHandler', err);

          //callback failure 
          //if no playlist edm for some reason 
          //unncomment 
          callbackFailure && callbackFailure(err)
        });

    }

    //processing converting all the song objects to the string to search deezer with 
    handleSongStrings(tracksObj) {


      //variables 
      //array of songs + artists 
      this.songsArr = []

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
        this.songsArr.push(tempObj)

      }
      
        return this.songsArr;

    }

    //get playlist specified in argument from user 
    getPlaylist(user, playlistName, callback) {

        //variables for this function 
        //id of the playlist 
        this.playlistID;
        //how many songs there are, to page through them 
        this.songCount;
        //the raw objects of individual tracks from the playlist
        this.trackObjects = [];

        // Get my playlists user jolaroux
        this.spotifyApi.getUserPlaylists(user)
          .then(function(data) {
            // console.log('Retrieved playlists', data.body.items);
            // console.log(data.body.items.length)

            //get ID of playlist EDM
            for (let playlist of data.body.items) {
              //if it's the right playlist 
              if (playlist.name == playlistName) {
                //have the id of playlist now
                this.playlistID = playlist.id
                //have song count too 
                this.songCount = playlist.tracks.total
                console.log(this.songCount + " songs in playlist " + playlistName)

              }
            }


            //getting tracks in playlist
            //need to loop through songCount and call get100Songs until the playlist empty 
            this.index = 0;
            //storing the song objects strings of song + artist
            this.songObjects = [];
            //tracksObj, user, id, index, max, callback, callbackFailure
            this.getSongsHandler(this.trackObjects, user, this.playlistID, this.index, this.songCount, 

              //callback success
              function(trackObjects) {

                //formatting the strings to search deezer 
                this.songObjects = this.handleSongStrings(trackObjects)

                //printing for now 
                // for (let o of songObjects) {
                //   console.log(o)
                // }
                this.writeTo(this.songObjects, './spotifySongs.json')

                //pass back through callback 
                callback && callback(this.songObjects)

              }.bind(this), 

              //callback failure
              function (err) {
                console.log(err)
              }
            )


          }.bind(this),function(err) {
            console.log('Something went wrong!', err);

            //callback failure 
            //if no playlist edm for some reason 
            //unncomment 
            callbackFailure && callbackFailure()

          });

    }
    
    
    //writes array to file sent
    writeTo(arr, file) {
      fs.writeFile(file, JSON.stringify(arr), 'utf8',  function(err) {
        if (err) {
          console.log(err)
        }

      })
    }

    
    
}



//exporting?
module.exports = HandleSpotify