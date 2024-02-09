class BoardDisplay {
  _canvas;
  _element;
  _pieceShapes = {};
  _drawnShapes = {};

  DRAWERS = [
    this.drawCrossPiece,
    this.drawCirclePiece,
    this.drawTrianglePiece,
    this.drawSquarePiece,
    this.drawDiamondPiece,
  ];

  constructor(canvasId) {
    this._canvas = rough.canvas(document.getElementById(canvasId));
    this._element = document.getElementById(canvasId);
  }

  /**
   * Draws a line on the board
   * @param {number} x1 X position of the first point
   * @param {number} y1 Y position of the first point
   * @param {number} x2 X position of the second point
   * @param {number} y2 Y position of the second point
   * @param {object} opts Options
   */
  line(x1, y1, x2, y2, opts) {
    let id = `l-${x1}-${y1}-${x2}-${y2}-${opts.stroke}-${opts.strokeWidth}-${opts.fill}-${opts.roughness}`;
    if (this._drawnShapes[id] === undefined) {
      const shape = this._canvas.line(x1, y1, x2, y2, {
        hachureGap: 8,
        ...opts,
      });
      this._drawnShapes = {
        [id]: shape,
        ...this._drawnShapes,
      };
      return shape;
    } else {
      this._canvas.draw(this._drawnShapes[id]);
    }
  }
  /**
   * Draws a circle on the board
   * @param {number} x X position of the circle
   * @param {number} y Y position of the circle
   * @param {number} r Radius of the circle
   * @param {object} opts Options
   */
  circle(x, y, r, opts) {
    let id = `c-${x}-${y}-${r}-${opts.stroke}-${opts.strokeWidth}-${opts.fill}-${opts.roughness}`;
    if (this._drawnShapes[id] === undefined) {
      const shape = this._canvas.circle(x, y, r, {
        hachureGap: 8,
        ...opts,
      });
      this._drawnShapes = {
        [id]: shape,
        ...this._drawnShapes,
      };
      return shape;
    } else {
      this._canvas.draw(this._drawnShapes[id]);
    }
  }

  /**
   * Draws a polygon on the board
   * @param {number[][]} points The vertices of the polygon
   * @param {object} opts Options
   */
  polygon(points, opts) {
    let id = `p-${JSON.stringify(points)}-${opts.stroke}-${opts.strokeWidth}-${
      opts.fill
    }-${opts.roughness}`;
    if (this._drawnShapes[id] === undefined) {
      const shape = this._canvas.polygon(points, {
        hachureGap: 8,
        ...opts,
      });
      this._drawnShapes = {
        [id]: shape,
        ...this._drawnShapes,
      };
      return shape;
    } else {
      this._canvas.draw(this._drawnShapes[id]);
    }
  }

  /**
   *
   * @param {number} x X position of the rectangle
   * @param {number} y Y position of the rectangle
   * @param {number} w Width of the rectangle
   * @param {number} h Height of the rectangle
   * @param {object} opts Options
   */
  rectangle(x, y, w, h, opts) {
    let id = `r-${x}-${y}-${w}-${h}-${opts.stroke}-${opts.strokeWidth}-${opts.fill}-${opts.roughness}`;
    if (this._drawnShapes[id] === undefined) {
      const shape = this._canvas.rectangle(x, y, w, h, {
        hachureGap: 8,
        ...opts,
      });
      this._drawnShapes = {
        [id]: shape,
        ...this._drawnShapes,
      };
      return shape;
    } else {
      this._canvas.draw(this._drawnShapes[id]);
    }
  }

  erase() {
    this._element
      .getContext('2d')
      .clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  drawCrossPiece(x, y, size, color, canvas) {
    if (canvas === undefined) {
      canvas = this;
    }
    let piece = canvas._pieceShapes[`cross-${x}-${y}-${size}-${color}`];
    if (piece === undefined) {
      piece = [];
      piece.push(
        canvas.line(x, y, x + size, y + size, {
          stroke: color,
          strokeWidth: spaceSize / 7,
          roughness: 2,
        })
      );
      piece.push(
        canvas.line(x + size, y, x, y + size, {
          stroke: color,
          strokeWidth: spaceSize / 7,
          roughness: 2,
        })
      );
      canvas._pieceShapes[`cross-${x}-${y}-${size}-${color}`] = piece;
    } else {
      for (let i = 0; i < piece.length; i++) {
        canvas._canvas.draw(piece[i]);
      }
    }
  }

  drawCirclePiece(x, y, size, color, canvas) {
    if (canvas === undefined) {
      canvas = this;
    }
    let piece = canvas._pieceShapes[`circle-${x}-${y}-${size}-${color}`];
    if (piece === undefined) {
      piece = [];
      piece.push(
        canvas.circle(x + size / 2, y + size / 2, size, {
          stroke: color,
          strokeWidth: spaceSize / 7,
          roughness: 2,
        })
      );
      canvas._pieceShapes[`circle-${x}-${y}-${size}-${color}`] = piece;
    } else {
      for (let i = 0; i < piece.length; i++) {
        canvas._canvas.draw(piece[i]);
      }
    }
  }

  drawTrianglePiece(x, y, size, color, canvas) {
    if (canvas === undefined) {
      canvas = this;
    }
    let piece = canvas._pieceShapes[`triangle-${x}-${y}-${size}-${color}`];
    if (piece === undefined) {
      piece = [];
      piece.push(
        canvas.polygon(
          [
            [x + size / 2, y],
            [x, y + size],
            [x + size, y + size],
          ],
          {
            stroke: color,
            strokeWidth: spaceSize / 7,
            roughness: 2,
            seed: (x + y) * size,
          }
        )
      );
      canvas._pieceShapes[`triangle-${x}-${y}-${size}-${color}`] = piece;
    } else {
      for (let i = 0; i < piece.length; i++) {
        canvas._canvas.draw(piece[i]);
      }
    }
  }

  drawSquarePiece(x, y, size, color, canvas) {
    if (canvas === undefined) {
      canvas = this;
    }
    let piece = canvas._pieceShapes[`square-${x}-${y}-${size}-${color}`];
    if (piece === undefined) {
      piece = [];
      piece.push(
        canvas.rectangle(x, y, size, size, {
          stroke: color,
          strokeWidth: spaceSize / 7,
          roughness: 2,
        })
      );
      canvas._pieceShapes[`square-${x}-${y}-${size}-${color}`] = piece;
    } else {
      for (let i = 0; i < piece.length; i++) {
        canvas._canvas.draw(piece[i]);
      }
    }
  }

  drawDiamondPiece(x, y, size, color, canvas) {
    if (canvas === undefined) {
      canvas = canvas;
    }
    let piece = canvas._pieceShapes[`diamond-${x}-${y}-${size}-${color}`];
    if (piece === undefined) {
      piece = [];
      piece.push(
        canvas.polygon(
          [
            [x + size / 2, y],
            [x + size, y + size / 2],
            [x + size / 2, y + size],
            [x, y + size / 2],
          ],
          {
            stroke: color,
            strokeWidth: spaceSize / 7,
            roughness: 2,
            seed: (x + y) * size,
          }
        )
      );
      canvas._pieceShapes[`diamond-${x}-${y}-${size}-${color}`] = piece;
    } else {
      for (let i = 0; i < piece.length; i++) {
        canvas._canvas.draw(piece[i]);
      }
    }
  }

  grid(x, y, w, h, cellSize) {
    const id = `grid-${x}-${y}-${w}-${h}-${cellSize}`;
    if (this._pieceShapes[id] === undefined) {
      this._pieceShapes[id] = [];
      for (let i = 1; i < w; i++) {
        this._pieceShapes[id].push(
          this.line(i * spaceSize, 0, i * spaceSize, this._element.height, {
            strokeWidth: spaceSize / 15,
            roughness: 1,
            seed: 1,
            stroke: '#000000',
          })
        );
      }

      for (let i = 1; i < h; i++) {
        this._pieceShapes[id].push(
          this.line(0, i * spaceSize, this._element.width, i * spaceSize, {
            strokeWidth: spaceSize / 15,
            roughness: 1,
            seed: 1,
            stroke: '#000000',
          })
        );
      }
    } else {
      for (let i = 0; i < this._pieceShapes[id].length; i++) {
        this._canvas.draw(this._pieceShapes[id][i]);
      }
    }
  }

  set width(val) {
    this._element.style.width = val + 'px';
    this._element.width = val;
  }

  set height(val) {
    this._element.style.height = val + 'px';
    this._element.height = val;
  }
}
