// Parse JSON input buttom
$('#parseJsonInputButton').on('click', function () {
  // attempt to parse the JSON
  let jsonString = $('#jsonInput').prop('value');
  // get rid of extra commas that happen when pasting from array
  if (jsonString.slice(-1) == ',') {
    jsonString = jsonString.slice(0,-1)
  }
  try {
    let jsonData = JSON.parse(jsonString);
    parseJSONData(jsonData);
  } catch(err) {
    $('#jsonError').text("JSON Parse error:" + err.message);
    return;
  }
  $('#jsonError').text("");
})

// Output JSON Input button
$('#outputJsonButton').on('click', function () {
  outputJSONData();
});

/*
============================================================================
JSON Parsing
============================================================================
*/

function parseJSONData(data) {
  if('Title' in data) {
    $('#inputTitle').val(data.Title);
  } else {
    $('#inputTitle').val('');
  }
  if('HP' in data) {
    $('#inputHP').val(data.HP);
  } else {
    $('#inputHP').val('');
  }
  if('Keywords' in data) {
    $('#inputKeywords').val(data.Keywords);
  } else {
    $('#inputKeywords').val('');
  }
  if('BoldedTerms' in data) {
    $('#inputBoldWords').val(data.BoldedTerms);
  } else {
    $('#inputBoldWords').val('');
  }
  if('GameText' in data) {
    $('#inputEffect').val(data.GameText);
  } else {
    $('#inputEffect').val('');
  }
  if('GameTextSize' in data) {
    $('#inputEffectTextSize').val(data.GameTextSize);
  } else {
    $('#inputEffectTextSize').val(100);
  }
  if('Quote' in data) {
    $('#inputQuote').val(data.Quote);
  } else {
    $('#inputQuote').val('');
  }
  if('Attribution' in data) {
    $('#inputAttribution').val(data.Attribution);
  } else {
    $('#inputAttribution').val('');
  }
  if('ImageURL' in data) {
    cardArtImage = new Image();
    cardArtImage.src = data.ImageURL;
    cardArtImage.onload = function (e) {
      // Once the Image has loaded, redraw the canvas so it immediately appears
      drawCardCanvas();
    }
  } else {
    cardArtImage = undefined;
  }
  if('ImageX' in data) {
    $('.inputImageOffsetX').val(data.ImageX);
  } else {
    $('.inputImageOffsetX').val(0);
  }
  if('ImageY' in data) {
    $('.inputImageOffsetY').val(data.ImageY);
  } else {
    $('.inputImageOffsetY').val(0);
  }
  if('ImageZoom' in data) {
    // special parsing for the zoom value, as if it's fed a non-number, it will
    // default to the middle of the bar, which is not the default
    let zoomVal = parseInt(data.ImageZoom);
    if (zoomVal == NaN) {
      zoomVal = 0;
    }
    $('.inputImageScale').val(zoomVal);
  } else {
    $('.inputImageScale').val(100);
  }
  if('Suddenly' in data && data.Suddenly.toUpperCase() == "TRUE") {
    $('#suddenly')[0].checked = true;
    suddenly = true;
  } else {
    $('#suddenly')[0].checked = false;
    suddenly = false;
  }
  drawCardCanvas();
}

function outputJSONData() {
  var imageURL = "";
  if (cardArtImage != null) {
    imageURL = cardArtImage.src;
  }
  var outputJSON = `{
    "Title": ${JSON.stringify($('#inputTitle').val())},
    "HP": ${JSON.stringify($('#inputHP').val())},
    "Keywords": ${JSON.stringify($('#inputKeywords').val())},
    "BoldedTerms": ${JSON.stringify($('#inputBoldWords').val())},
    "GameText": ${JSON.stringify($('#inputEffect').val())},
    "GameTextSize": ${JSON.stringify($('#inputEffectTextSize').val())},
    "Quote": ${JSON.stringify($('#inputQuote').val())},
    "Attribution": ${JSON.stringify($('#inputAttribution').val())},
    "ImageURL": ${JSON.stringify(imageURL)},
    "ImageX": ${JSON.stringify($('.inputImageOffsetX').val())},
    "ImageY": ${JSON.stringify($('.inputImageOffsetY').val())},
    "ImageZoom": ${JSON.stringify($('.inputImageScale').val())},
    "Suddenly": "${JSON.stringify($('#suddenly')[0].checked)}"
  },`;
  $('#jsonInput').val(outputJSON);
}


/*
============================================================================
Effect text values
============================================================================
*/
// Space between words
const spaceWidthFactor = 0.26;
let spaceWidth = effectFontSize * spaceWidthFactor;

const effectMarginXPercent = 12.5; // Percent of width on each side of text
const effectStartX = pw(effectMarginXPercent); // Left boundary of effect text
const effectEndX = pw(100 - effectMarginXPercent + 1); // Right boundary of effect text
const effectStartY = ph(61.5); // Top boundary of effect text
const effectPhaseStartX = pw(6.5); // Left boundary of phase label images

const effectBaseLineHeight = pw(5);
let lineHeight = effectBaseLineHeight * effectFontScale; // Distance between two lines in the same paragraph
const blockSpacingFactor = 1.3; // Multiply lineHeight by this to get the distance between two blocks
const prePhaseLineHeightFactor = 1.2; // Spacing above phase block
const postPhaseLineHeightFactor = 1.05; // Spacing below phase block

let currentIndentX = effectStartX; // Different x position to reset to when drawing a block with an indent (such as a POWER:)
let currentOffsetX = 0; // Current x position for draw commands
let currentOffsetY = 0; // Current y position for draw commands

// Set of default bolded terms
const defaultBoldList = new Set(["START PHASE", "PLAY PHASE", "POWER PHASE", "DRAW PHASE", "END PHASE", "PERFORM", "ACCOMPANY"]);
// Set of default italicized terms
const defaultItalicsList = new Set(["PERFORM", "ACCOMPANY"]);

// These phrases will be automatically bolded
var effectBoldList = Array.from(defaultBoldList);
// These phrases will be automatically italicized
var effectItalicsList = Array.from(defaultItalicsList);

// load custom effect list if it exists
function loadEffectList() {
  let customEffectList = $('#inputBoldWords').prop('value');
  if (customEffectList) {
    customEffectList = customEffectList.toUpperCase();
    customEffectList = customEffectList.split(",").map(x => x.trim());
    customEffectList = customEffectList.filter(effect => effect != "");
  } else {
    customEffectList = [];
  }
  // reset the lists
  let newBoldList = new Set(defaultBoldList);
  let newItalicsList = new Set(defaultItalicsList);
  // add new elements
  customEffectList.forEach((effect) => {
    newBoldList.add(effect);
    newItalicsList.add(effect);
  });
  // change back to arrays
  effectBoldList = Array.from(newBoldList);
  effectItalicsList = Array.from(newItalicsList);
}

/*
============================================================================
Loading and app prep-work
============================================================================
*/


// Get and load default card frame
var cardFrameImageURL = "https://by3302files.storage.live.com/y4mhWQwi5poV1KRuT-IOCVunYPBbQh4xFdXUFvUcwTA1AglOPKKB_DVlkFWevg_arOLVEA4QcyFpwJJw4Gf5cPA9ZQkp9HWKv8cmKU-qQCsaTFLZxdu-tMZXQppvTNPzEUezInBZeMjRY3WuIdDD8pqYuSXaXJClB2YjL3yA3ihvecCW8hkfaCPdZwQjK3ARg88?width=586&height=823&cropmode=none";
var cardFrameImage = new Image();
//cardFrameImage.src = cardFrameImageURL;
cardFrameImage.src = '../_resources/hero deck card front frame.png'
cardFrameImage.onload = function (e) {
  // Once the Image has loaded, redraw the canvas so it immediately appears
  drawCardCanvas();
}

// Get and load other graphics
// Note: Google Drive simple view link: https://drive.google.com/uc?id=FILE_ID
let imagesToPreload = [
  ['Start Phase Icon', '../_resources/phase icon start.svg'],
  ['Play Phase Icon', '../_resources/phase icon play.svg'],
  ['Power Phase Icon', '../_resources/phase icon power.svg'],
  ['Draw Phase Icon', '../_resources/phase icon draw.svg'],
  ['End Phase Icon', '../_resources/phase icon end.svg'],
  ['Start Phase Icon High Contrast', '../_resources/phase icon start - high contrast.svg'],
  ['Play Phase Icon High Contrast', '../_resources/phase icon play - high contrast.svg'],
  ['Power Phase Icon High Contrast', '../_resources/phase icon power - high contrast.svg'],
  ['Draw Phase Icon High Contrast', '../_resources/phase icon draw - high contrast.svg'],
  ['End Phase Icon High Contrast', '../_resources/phase icon end - high contrast.svg'],
  ['HP Graphic', '../_resources/HP Graphic.svg'],
  ['Base Hero Card', '../_resources/hero deck card front frame.png'],
  ['Suddenly Hero Card', '../_resources/hero deck card front frame suddenly.png'],
  ['Suddenly Tag', '../_resources/suddenly-tag.png']
]
let loadedGraphics = {};
imagesToPreload.forEach((image) => {
  let newImage = new Image();
  newImage.src = image[1];
  loadedGraphics[image[0]] = newImage;
})

// Save the uploaded image so it doesn't have to load each time
var cardArtImage;
$('#inputImageFile').on('input', function (e) {
  // Get the uploaded file
  var cardImage = e.target.files[0];
  // If a file has been uploaded...
  if (cardImage) {
    // Turn that file into a useable Image object
    var url = URL.createObjectURL(cardImage);
    cardArtImage = new Image();
    cardArtImage.src = url;
    cardArtImage.onload = function (e) {
      // Once the Image has loaded, redraw the canvas so it immediately appears
      drawCardCanvas();
    }
  }
})

// Whenever one of the content inputs has its value changed (including each character typed in a text input), redraw the canvas
$('.contentInput').on('input', drawCardCanvas);

/*
============================================================================
Drawing the canvas
============================================================================
*/

// Draw the canvas from scratch (this function gets called whenever an input changes)
function drawCardCanvas() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset context states
  ctx.restore();
  ctx.save();

  // Draw a blank white rectangle background (for if no image so it's not awkwardly transparent)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the card art (if it exists)
  if (cardArtImage) {
    drawCardArt();
  }

  // Reset context states
  ctx.restore();
  ctx.save();

  // Draw the card frame, check if suddenly
  if (suddenly) {
    ctx.drawImage(loadedGraphics['Suddenly Hero Card'], 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(loadedGraphics['Base Hero Card'], 0, 0, canvas.width, canvas.height);
  }
  // load new list of effects
  loadEffectList();

  // Draw the card title and HP
  drawCardTitle();

  // Reset context states
  ctx.restore();
  ctx.save();

  // Draw the card keywords
  drawCardKeywords();

  // Draw the card effect
  drawBodyText(parseCardBody());

  // Draw the card quote
  drawCardQuote();

  // Draw the card quote attribution
  drawCardAttribution();
}

function drawCardArt() {

  // Crunch some numbers to get the crop, position, and scale of the image
  let outerX = 4; // Margin between left/right edge and crop area
  let imageAreaWidth = pw(100 - outerX * 2);
  let imageAreaHeight = ph(45.5);
  let imageAreaRatio = imageAreaWidth / imageAreaHeight;
  let imageAreaTop = ph(11.2);
  let imageWidth = cardArtImage.width;
  let imageHeight = cardArtImage.height;
  let imageRatio = imageWidth / imageHeight;
  let initialScale = 1;


  // Create clipping region
  ctx.beginPath();
  ctx.rect(pw(outerX), imageAreaTop, imageAreaWidth, imageAreaHeight);
  ctx.closePath();
  // startX, startY, width, height
  ctx.clip();
  // Get offset values
  let imageOffsetX = parseInt($('.inputImageOffsetX').prop('value'));
  let imageOffsetY = parseInt($('.inputImageOffsetY').prop('value')) * -1;
  let userScale = parseInt($('.inputImageScale').prop('value'));

  // Draw the image

  if (imageRatio > imageAreaRatio) {
    // If image ratio is wider than image area ratio, fit to height
    initialScale = imageAreaHeight / imageHeight;
  }
  else {
    // Otherwise, fit to width
    initialScale = imageAreaWidth / imageWidth;
  }
  let drawScale = initialScale * userScale / 100; // Eventually I'll add user input to this

  // Scale the image
  let drawWidth = imageWidth * drawScale;
  let drawHeight = imageHeight * drawScale;
  // Horizontally center the image in the area
  let drawX = (pw(50) - drawWidth / 2);
  // Add user offset
  drawX += drawWidth * imageOffsetX / 100;
  // Vertically center the image in the area
  let drawY = (imageAreaTop + imageAreaHeight / 2 - drawHeight / 2);
  // Add user offset
  drawY += drawHeight * imageOffsetY / 100;

  // Finally, draw the image to the canvas!
  ctx.drawImage(cardArtImage, drawX, drawY, drawWidth, drawHeight);
}



function drawCardTitle() {
  // Check for HP input
  let hasHP = false;
  let inputHP = $('#inputHP').prop('value');
  if (inputHP != '') {
    hasHP = true;
    // Draw the HP graphic
    let hpGraphicSize = pw(18.8);
    let hpGraphicX = pw(80.5);
    let hpGraphicY = pw(0.6);
    ctx.drawImage(loadedGraphics['HP Graphic'], hpGraphicX, hpGraphicY, hpGraphicSize, hpGraphicSize);
    // Draw the HP text
    let hpFontSize = pw(8.7);
    // Downsize if more than 2 digits
    if (inputHP.length > 2) {
      hpFontSize = pw(6.2);
    }
    ctx.font = "600 " + hpFontSize + "px Boogaloo";
    ctx.fillStyle = colorBlack;
    ctx.textAlign = "center";
    let hpTextX = hpGraphicX + hpGraphicSize / 2.09;
    let hpTextY = hpGraphicY + hpGraphicSize / 2 + hpFontSize / 2.8;
    ctx.fillText(inputHP, hpTextX, hpTextY);
  }
  // Handle the title
  let title = $('#inputTitle').prop('value');
  //title = title.split("").join(String.fromCharCode(8202)); // Extra letter spacing: 8201 for slightly more, 8202 for slightly less
  let titleFontSize = pw(6.1);
  ctx.font = "600 " + titleFontSize + "px Boogaloo";
  ctx.textAlign = "center";
  ctx.strokeStyle = colorBlack;
  ctx.lineWidth = pw(0.8);
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3;
  // if this is a suddenly card, text color needs to be white
  if (suddenly) {
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.fillStyle = '#fcb024';
  }
  let titleX = pw(50);
  // Offset horizontal center if card has HP
  if (hasHP) {
    titleX = pw(46);
  }
  let titleY = ph(10.3);
  // the suddenly frame is slightly lower than the default frame
  if (suddenly) {
	  titleY = ph(10.8);
  }
  let squish = 1.06; // Stretch the font a little
  ctx.save();
  ctx.scale(squish, 1); // Apply the stretch
  titleX = titleX / squish;
  ctx.strokeText(title.toUpperCase(), titleX, titleY);
  ctx.fillText(title.toUpperCase(), titleX, titleY);
  ctx.restore();
}


function drawCardKeywords() {
  // Get user input
  let keywords = $('#inputKeywords').prop('value');
  if (keywords) {
    // Convert to all uppercase letters
    keywords = keywords.toUpperCase();
    // Adjust space width
    keywords = keywords.replaceAll(' ', String.fromCharCode(8202) + String.fromCharCode(8202));
    // add whitespace to make room for suddenly tag
    if (suddenly) {
      keywords = 'SUDDENLY  ' + keywords
    }
    // Keyword font
    let keywordFontSize = pw(4.5);
    ctx.font = '400 ' + keywordFontSize + 'px Boogaloo';
    // Squish the keyword font a little
    let keywordSquish = 0.95;
    // Get keywords text width
    let keywordsWidth = ctx.measureText(keywords).width;
    // Box dimensions
    let boxMargin = pw(1); // Left and right margin between text and box border
    let boxX = pw(6.5);
    let boxY = ph(52.6);
    let boxHeight = ph(4.8);
    let boxWidth = keywordsWidth * keywordSquish + boxMargin * 2;
    // Box style
    ctx.fillStyle = '#fcb024';
    ctx.strokeStyle = colorBlack;
    ctx.lineWidth = pw(1.1);
    // Draw the box
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    // Keywords style
    ctx.fillStyle = colorBlack;
    let keywordsX = (boxX + boxMargin) * 1 / keywordSquish;
    let keywordsY = boxY + boxHeight * 0.74;
    ctx.textAlign = "left";
    ctx.save();
    ctx.scale(keywordSquish, 1);
    // Draw the keywords
    ctx.fillText(keywords, keywordsX, keywordsY);
    // Undo the squish for future drawings
    ctx.restore();
    // add suddenly tag
    if (suddenly) {
      ctx.drawImage(loadedGraphics['Suddenly Tag'], pw(5.5), ph(51), pw(20), ph(7.5));
    }
  }
}


function drawCardQuote() {
  // Get input value
  let inputValue = $('#inputQuote').prop('value');
  // Quote style properties
  ctx.fillStyle = colorBlack;
  let quoteFontSize = pw(3.5);
  ctx.font = "400 normal " + quoteFontSize + "px Unmasked BB";
  ctx.textAlign = "center";
  let quoteMaxWidth = pw(75);
  let quoteCenterX = pw(50);
  let quoteCenterY = ph(92.3);
  let quoteLineHeight = quoteFontSize * 0.93;

  // Set the string of text to work with
  let quoteString = inputValue;

  // Extract all the words
  let words = quoteString.split(' ');

  // Detect when there should be a line break
  let lines = [''];
  let currentLineIndex = 0;
  for (let i = 0; i < words.length; i++) {
    // First word of quote is easy
    if (i === 0) {
      lines[currentLineIndex] = words[i];
      continue;
    }
    // For all other words...
    // Check if adding this word would cause the line width to exceed the maximum
    let lineWithWordAdded = lines[currentLineIndex] + ' ' + words[i];
    if (ctx.measureText(lineWithWordAdded).width < quoteMaxWidth) {
      // Add word to current line
      lines[currentLineIndex] += ' ' + words[i];
    }
    else {
      // Break into new line
      currentLineIndex++;
      lines[currentLineIndex] = words[i];
    }
  }

  // Iterate through lines
  let quoteTotalHeight = quoteLineHeight * lines.length;
  for (let i = 0; i < lines.length; i++) {
    // Determine drawing origin
    let drawX = quoteCenterX;
    let drawY = quoteCenterY - (quoteTotalHeight / 2) + (quoteLineHeight * i);
    // Draw the line of text
    ctx.fillText(lines[i], drawX, drawY);
  }
}



function drawCardAttribution() {
  // (Mostly copied from drawCardKeywords()!)
  // Get user input
  let keywords = $('#inputAttribution').prop('value');
  if (keywords) {
    // Convert to all uppercase letters
    keywords = keywords.toUpperCase();
    // Keyword font
    let keywordFontSize = pw(3.3);
    ctx.font = "400 italic " + keywordFontSize + "px Unmasked BB";
    // Squish the keyword font a little
    let keywordSquish = 0.9;
    // Get keywords text width
    let keywordsWidth = ctx.measureText(keywords).width;
    // Box dimensions
    let boxMargin = pw(1); // Left and right margin between text and box border
    let cornerSpace = pw(4.2);
    let boxX = pw(100) - cornerSpace; // Right side of box
    let boxY = ph(100) - cornerSpace; // Bottom of box
    let boxHeight = ph(2.1);
    let boxWidth = keywordsWidth * keywordSquish + boxMargin * 2;
    boxX -= boxWidth;
    boxY -= boxHeight;
    // Box style
    ctx.fillStyle = '#fcb024';
    ctx.strokeStyle = colorBlack;
    ctx.lineWidth = pw(1.1);
    // Draw the box
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    // Keywords style
    ctx.fillStyle = colorBlack;
    let keywordsX = (boxX + boxMargin) * 1 / keywordSquish;
    let keywordsY = boxY + boxHeight * 0.80;
    ctx.textAlign = "left";
    ctx.save();
    ctx.scale(keywordSquish, 1);
    // Draw the keywords
    ctx.fillText(keywords, keywordsX, keywordsY);
    // Undo the squish for future drawings
    ctx.restore();
  }
}

/* NOTEPAD

Official card contents for testing:

EXPENDABLE POWER BANK
ITEM, LIMITED
[PLAY PHASE]
You may put 1 card from your trash under 1 Ordnance card in play. If you do, put this card under 1 Ordnance card in play.
[END PHASE]
Put the top card of your deck under 1 Ordnance card in play.
"Sure, it's a bit of a weak point, but the other alternative is fewer bells and whistles, and we can't have that!"
--Bunker, Freedom Five #410

ATLANTEAN STORMBLADE
After any Weather card is destroyed, Tempest deals 1 target 1 lightning damage.
POWER: Tempest deals 1 target 3 irreducible lightning damage. Then, destroy 1 Weather card.

WRATHFUL RETRIBUTION
ONGOING
[START PHASE]
Fanatic deals 1 target x radiant damage, where X is Fanatic's maximum HP minus her current HP. Then, bury this card.

UNFLAGGING ANIMATION
Ongoing, Limited
-1 damage dealt to Construct cards.
[START PHASE]
Either discard 1 card or destroy this card.
[END PHASE]
The Construct card with the lowest HP regains 2 HP.
"I know little of your people, but I understand fear, and innocent lives in danger. I will keep you safe. I swear it."


*/
