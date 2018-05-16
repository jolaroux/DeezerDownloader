/*****************************
This "class" handles getting the spotify account set up,
and getting the song information for a given playlist
*****************************/

"use strict";

// the "class" itself 
//base class, no extends
class handleSpotify{
    //constructor is literally named constructor for some reason 
    constructor() {
        
        //variables 
        this.scopes = ['user-read-private', 'user-read-email'],
            redirectUri = 'http://localhost:8888/callback',
            clientId = '5ddacffa892542a08bd9927c226dad43',
            clientSecret = '45b90caa6aae43ddbd969bdc3982f5b4',
            state = 'some-state-of-my-choice',
            accessCode = ''.
            refreshCode = '';

        //credentials for creation 
        this.credentials = {
            clientId : clientId,
            clientSecret : clientSecret,
            redirectUri : redirectUri
        }

        //temp code that was returned 
        this.code = ''

        // creating the wrapper app 
        this.spotifyApi = new SpotifyWebApi(credentials);
    }
    
    
}






// Food is a base class
class Food {

    constructor (name, protein, carbs, fat) {
        this.name = name;
        this.protein = protein;
        this.carbs = carbs;
        this.fat = fat;
    }

    toString () {
        return `${this.name} | ${this.protein}g P :: ${this.carbs}g C :: ${this.fat}g F`
    }

    print () {
      console.log( this.toString() );
    }
}

const chicken_breast = new Food('Chicken Breast', 26, 0, 3.5);

chicken_breast.print(); // 'Chicken Breast | 26g P :: 0g C :: 3.5g F'
console.log(chicken_breast.protein); // 26 (LINE A)