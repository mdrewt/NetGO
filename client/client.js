// Subscribe to the database so you will know when the game changes
Meteor.subscribe("games", function(){});

// Define variables. RuleSet for the getAdjacent method (move into Board object?), 
// var rules = new RuleSet();
var Games = new Meteor.Collection("games");
var game = Games.find();

// Define function to determine if it's black's turn or white's. Possibly simplify this to a (!)toggle and store as data?
var turn = function(moveList) {
  if (moveList.length % 2 == 0 ) {
    return "black";
  } else {
    return "white";
  }
};

Template.info.helpers({
  turn: function() {try {return turn(game.fetch()[0].moveList);}catch(err){}}
});

$('document').ready(function() {
  
  // Defining the board model that's going to be doing most of the work. (Move all the view stuff into the renderer object? Move definition above document.ready() then load in the canvas?)
  var renderer = new Renderer(document.getElementById("canvas"));
  goban = new Board();
  
  // Redraws the position each time the game updates. (Will this also remove absent stones?)
  Tracker.autorun(function() {
    renderer.renderBoard();
    renderer.drawPosition(goban.fromJson(game.fetch()[0]));
  });
  
  // Listening for clicks on the board.
  renderer.canvas.addEventListener("mousedown", function(e) {
    // Each space is a 40px square so this calculates the coordinates of the space you clicked on
    var rect = this.getBoundingClientRect();
    var row = Math.floor((e.clientY - rect.top)/40);
    var column = Math.floor((e.clientX - rect.left)/40);
    
    // Make sure the space is empty (moves on occupied spaces are not allowed.)
    if (goban.isEmpty(row, column)) {
      // Store the turn number so you only have to do a lookup once.
      var turnNum = goban.moveList.length;
      // Determining whether the stone is white or black. (change turn() to use turnNum?)
      goban.position[row][column].status = turn(goban.moveList);
      // Each group is identified by the turn it was last updated on
      goban.position[row][column].group = turnNum;
      
      // Create a group for the stone you just played and add it to that group.
      goban.groups[turnNum] = [];
      goban.groups[turnNum].push(goban.position[row][column]);
      
      // Grabs the spaces adjacent to the stone you just placed. Then for each one it checks if that space is occupied by a stone of the same color. if it it it looks up which group that stone is in, looks up all the stones in that group, adds them to the new group, and deletes the old. 
      var adjacentSpaces = goban.getAdjacent(row, column);
      for(var i=0; i<adjacentSpaces.length; i++) {
        // If the space is occupied by a stone of the same color
        if(adjacentSpaces[i].status ==  goban.position[row][column].status) {
          // Then grab that stone's group
          var oldGroup = adjacentSpaces[i].group;
          goban.assignGroup(oldGroup, turnNum);
        }
      }
      // Finally add the new move to the move list and send the new board to the database.
      goban.moveList.push(goban.position[row][column]);
      Games.update(goban._id, {$set: goban.toJson()});
    } else {
      console.log("You can't go there.");
    }
    
  });
});