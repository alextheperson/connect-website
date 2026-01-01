# Connect *k* &nbsp; <img src="https://alexsol.is/project/connect/tokens/cross.svg/c37d4d" width="25"> <img src="https://alexsol.is/project/connect/tokens/circle.svg/29ab48" width="25"> <img src="https://alexsol.is/project/connect/tokens/triangle.svg/733eaf" width="25"> <img src="https://alexsol.is/project/connect/tokens/square.svg/c42860" width="25"> <img src="https://alexsol.is/project/connect/tokens/diamond.svg/2caec0" width="25">

## About

Connect *K* is a website that allows you to play games that involve placing tokens on a finite sized board. The goal of this project is to allow as many different types of games to be played as possible. This is accomplished by writing a framework within which are a variety of "engines" that allow you to play games with different rules.

Currently, there are two engines that I have finished: the `Standard Engine` and the `Gravity Engine` (see below).

## Usage

The website is hosted at [alexsol.is/project/connect/](http://alexsol.is/project/connect/). There, you can create a new game or join an existing game. When starting a game, you are brought to a configuration page, which allows you to configure the game that you would like to play. Be aware that some of the options are not implemented yet (specifically the timing options and the correspondence option). Once you start the game, you will get a three digit code for the game. Give the code to the other players to allow them to join the game. There is also an option to allow additional players to join the game as spectators.

### Pieces and Turns
This is a somewhat confusing part of the configuration. It allows you to make some very interesting games where players share pieces or each control multiple pieces.

The pieces control allows you to set how many pieces you want to use in the game. You can have up to 10 pieces. Each piece also has a checkbox which lets you set whether a player will win when they get many of them in a row. Each piece has a color associated with it.

The turns control allows you to set the sequence of turns in the game. Each turn has a player (indicated with a shape) and a piece (indicated with a color). This allows each turn to be represented with a colored shape.

<img width="572" height="384" alt="image" src="https://github.com/user-attachments/assets/080072f5-cd30-4fa0-a6a0-ab02d2dc6ee9" />

In this example, there are 4 pieces, the first two of which can win. Each round gives both players two turns: one with a winnable piece, and one with a non-winning piece that they can use to block the other player.

## Implemented Engines

**Standard Engine**
The `Standard Engine` is the simplest engine. It allows you to play games like [Tic-Tac-Toe](https://en.wikipedia.org/wiki/Tic-tac-toe), [Connect 4](https://en.wikipedia.org/wiki/Connect_Four), or [Gomoku](https://en.wikipedia.org/wiki/Gomoku). It allows you to configure the size of the board and the number of tokens you need to get in a row in order to win. It also allows you to enable static gravity.

**Gravity Engine**
The `Gravity Engine` does everything that the `Standard Engine` does, but has a fancier gravity algorithm. This allows the gravity to change turn-by-turn or every round. You are able to configure the sequence of gravity directions.

## Future/In Progress Engines

**Fractal Engine**
The `Fractal Engine` will allow you to play games like [Ultimate Tic-Tac-Toe](https://en.wikipedia.org/wiki/Ultimate_tic-tac-toe) that use boards within boards

**Hexagonal Engine**
As you might expect, the `Hexagonal Engine` will allow you to play games on a hexagonal grid instead of a rectangular one.

**Multidimensional Engine**
The `Multidimensional Engine` will allow you to play games in three or more dimensions.
