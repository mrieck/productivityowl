//https://github.com/gtomitsuka/gibberish-detector.js
/* Open-source! JS Port by Gabriel Tomitsuka. Original Version by @ProgramFOX */
(function (exports) {
  'use strict';
  
  //This function divides the string in chunks 
  function divideByChunks(string) {
    var charArray = [];

    while (charArray.length < (string.length / 35)) {
      charArray.push(string.substring(0, 35));
      string = string.substring(36);
    }

    if (charArray.length >= 1 && charArray[charArray.length - 1].length < 10) {
      charArray[charArray.length - 2] += charArray[charArray.length - 1];
      charArray.pop();
    }
    return charArray;
  };

  function getUniqueCharsInChunk(string) {
    return getUnique(string).length;
  }

  function getUniqueCharsInArray(array) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
      result.push(getUniqueCharsInChunk(array[i]));
    }
    return result * 100;
  }

  function getAverage(a) {
    var sum = 0;
    for (var i = 0; i < a.length; i++) {
      sum += parseFloat(a[i], 10);
    }
    return sum / a.length;
  }

  function getVowelFrequency(string) {
    var vowelFreq = 0;
    var normalFreq = 0;
    for (var i = 0; i < string.length; i++) {
      var character = string.charAt(i);
      if (!character.match(/^[a-zA-Z]+$/))
        continue;

      if (character.match(/^(a|e|i|o|u)$/i))
        vowelFreq++;
        
      normalFreq++;
    }

    if (normalFreq !== 0)
      return vowelFreq / normalFreq * 100;
    else
      return 0;
  };

  function getWordToCharRatio(string) {
    var wordArray = string.split(/[\W_]/);
    return wordArray.length / string.length * 100;
  }

  function getDeviationScore(percentage, lowerBound, upperBound) {
    if (percentage < lowerBound)
      return getBaseLog(lowerBound - percentage, lowerBound) * 100;
    else if (percentage > upperBound)
      return getBaseLog(percentage - upperBound, 100 - upperBound) * 100;
    else
      return 0;
  }

  //Utility Functions
  function getUnique(s) {
    var chars = {},
      rv = '';

    for (var i = 0; i < s.length; ++i) {
      if (!(s[i] in chars)) {
        chars[s[i]] = 1;
        rv += s[i];
      }
    }

    return rv;
  };

  //Thanks to Jano González from SE for this
  function verifyEmptyness(str) {
    return (str.length === 0 || !str.trim());
  };
  
  function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
  };
  
  exports.detect = function (string) {
    if (verifyEmptyness(string))
      return 0;

    var chunks = divideByChunks(string);

    var uniqueCharsInArray = getAverage(getUniqueCharsInArray(chunks));
    var vowelFrequency = getVowelFrequency(string);
    var wordToCharRatio = getWordToCharRatio(string);

    var uniqueCharsInArrayDev = Math.max(1, getDeviationScore(uniqueCharsInArray, 45, 50));
    var vowelFrequencyDev = Math.max(1, getDeviationScore(vowelFrequency, 35, 45));
    var wordToCharRatioDev = Math.max(1, getDeviationScore(wordToCharRatio, 15, 20));

    return Math.max(1, (Math.log10(uniqueCharsInArrayDev) + Math.log10(vowelFrequencyDev) + Math.log10(wordToCharRatioDev)) / 6 * 100);
  };
})(typeof exports === 'undefined' ? this['gibberish'] = {} : exports);
