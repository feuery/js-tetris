const grid_w = 50, grid_h = 50;
const blocks = [[[1, 1],
		 [1, 1]],

		[[1, 1, 1]],

		[[1, 1, 1], [0, 0, 1]],
		[[0, 0, 1], [1, 1, 1]],
		[[1, 0], [1, 1], [0, 1]],
		[[0, 1], [1, 1], [1, 0]]]

function rand(max) {
  return Math.floor(Math.random() * max);
}

let world = null;
let current_block = {position: [4, 4],
		     data: blocks[rand(blocks.length)]};

function getCtx() {
    const canvas = document.querySelector('#canv');
    if(!canvas.getContext) {
	alert('no getContext on canvas, please run a modern browser');
	return null;
    }

    return [canvas.getContext("2d"), canvas];
}

function max_dimensions(canvas) {
    return [canvas.width / grid_w,  
	    canvas.height / grid_h].map(Math.floor);
}

const WHITE = 0;
const RED = 1;

function create_world (canvas) {
    let world = []
    let [world_w, world_h] = max_dimensions(canvas);
    for (let x = 0; x < world_w; x++) {
	let row = [];
	for (let y = 0; y < world_h; y++) {
	    row.push(WHITE);
	}
	world.push(row);
    }

    return world;
}

function toHexColor(color_code) {
    return color_code == WHITE?
	"#FFFFFF":
	color_code == RED?
	"#FF0000"
	// the wtf-color
	: "#00AA00";
}

function toWorldCoord (x, y) {
    return [( x * grid_w) + 10, y * grid_h + 10, grid_w - 20, grid_h - 20];
}    

function drawWorld(ctx, canvas, world) {
    let [world_w, world_h] = max_dimensions(canvas);

    for(let x = 0; x < world_w; x++)
	for(let y = 0; y < world_h; y++) {
	    let block_color = world[x][y]
	    ctx.fillStyle = toHexColor(block_color);
	    let [w_x, w_y, width, height] = toWorldCoord(x, y);
	    ctx.fillRect (w_x, w_y, width, height);
	}

    // draw current block
    let [block_x, block_y] = current_block.position;
    for(let x = 0; x < current_block.data.length; x++)
	for(let y = 0; y < current_block.data[x].length; y++) {
	    let color = current_block.data[x][y];
	    ctx.fillStyle = toHexColor(color);

	    let [w_x, w_y, width, height] = toWorldCoord(x, y);
	    ctx.fillRect (w_x + (block_x * grid_w) , w_y + (block_y * grid_h), width, height);
	}
}

function keyup(e) { /*
    if (e.key == oldkey)
    {
	direction = [0, 0]
	return;
    }
    
    switch(e.key) {
    case 'ArrowUp':
	direction = [0, -1];
	break;
    case 'ArrowDown':
	direction = [0, 1];
	break;
    case 'ArrowLeft':
	direction = [-1, 0];
	break;
    case 'ArrowRight':
	direction = [1, 0];
	break;
    }

    oldkey = e.key; */
}

function draw_line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function draw() {
    let [ctx, canvas] = getCtx();

    // cls
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);    

    // the grid
    ctx.strokeStyle = "#FFFFFF";
    for(let x = 0; x < Math.floor(canvas.width / grid_w); x++) {
	draw_line(ctx, x * grid_w, 0, x * grid_w, canvas.height)
    }
    
    for (let y = 0; y < Math.floor(canvas.height / grid_h); y++) {
	draw_line(ctx, 0, y * grid_h, canvas.width, y * grid_h);
    }

    // world rendering
    drawWorld(ctx, canvas, world);
}


document.addEventListener("DOMContentLoaded", e => {
    let [ctx, canvas] = getCtx();
    world = create_world(canvas);
    draw();
});

document.addEventListener('keyup', keyup);
