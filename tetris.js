let lost = false;
const grid_w = 50, grid_h = 50;
const blocks = [[[1, 1],
		 [1, 1]],

		[[1, 1, 1, 1]],

		[[1, 1, 1], [0, 0, 1]],
		[[0, 0, 1], [1, 1, 1]],
		[[1, 0], [1, 1], [0, 1]],
		[[0, 1], [1, 1], [1, 0]]]

function block_height(block) {
    return block.data[0].length;
}

function block_width(block) {
    return block.data.length;
}

function rand(max) {
    return Math.floor(Math.random() * max);
}

let world = null;
const init_position = [0, 0];

function init_block() {
    return {position: init_position,
	    data: blocks[rand(blocks.length)]};
}

let current_block = init_block();

function vec_plus (vec1, vec2) {
    let [x1, y1] = vec1,
	[x2, y2] = vec2;
    return [x1 + x2, y1 + y2];
}

function vec_eq (vec1, vec2) {
    let [x1, y1] = vec1,
	[x2, y2] = vec2;
    return x1 == x2 && y1 == y2;
}

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

	    if (color == WHITE) continue;
	    
	    ctx.fillStyle = toHexColor(color);

	    let [w_x, w_y, width, height] = toWorldCoord(x, y);
	    ctx.fillRect (w_x + (block_x * grid_w) , w_y + (block_y * grid_h), width, height);
	}
}

const transpose = array => array[0].map((r, i) => array.map(c => c[i]));

function rotate_block(block) {
    block.data = transpose(block.data);
    return block;
}

function collides_horizontally(block) {
    let [x, y] = block.position;
    let w = block_width(block),
	h = block_height(block);
    let right_x = x + w,
	down_y = y + h;

    let coords = [];

    try {
	for (let yy = y; yy < down_y; yy++) {
	    let x1 = x-1;
	    if (x1 > 0 &&
		world[x1][yy] == RED) return 'LEFT';

	    if(world[right_x][yy] == RED) return 'RIGHT';
	}
	
	return false;
    }
    catch (ex) {
	console.error(ex);
	return false;
    }
}

function collides_next_step(block) {
    let [x, y] = block.position;
    let w = block_width(block),
	h = block_height(block);
    let right_x = x + w,
	down_y = y + h;

    let coords = [];

    for (let xx = x; xx < right_x; xx++) {
	// coords.push([xx, y - 1]);
	coords.push([xx, down_y]);
    }
    
    for(let [x, y] of coords) {
	if ( x < 0 || y < 0) continue;
	let block = world[x][y];
	if (block == RED) return true;
    }
    return false;
}

function keyup(e) {

    if(lost) return;
    
    switch(e.key) {
    case 'ArrowUp':
	current_block = rotate_block(current_block);
	break;
	// case 'ArrowDown':
	// 	direction = [0, 1];
	// 	break;
    case 'ArrowLeft':
	if (collides_horizontally(current_block) != 'LEFT' &&
	    current_block.position[0] > 0) {
	    current_block.position = vec_plus(current_block.position,
					      [-1, 0]);
	    draw();
	}
	break;
    case 'ArrowRight':
	let [ctx, canvas] = getCtx();
	let [world_w, world_h] = max_dimensions(canvas);

	if(collides_horizontally(current_block) != 'RIGHT' &&
	   (current_block.position[0] + block_width(current_block)) < world_w) {
	    current_block.position = vec_plus(current_block.position,
					      [1, 0]);
	    draw();
	}
	break;
    }
}

function draw_line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function there_are_full_rows() {
    let transposed_world = transpose(world);
    let relevant_indexes =
	transposed_world.map((subarray, index) => {
	    return {full_row: subarray.every(element => element == RED),
		    index}
	})
	.filter(o => {
	    return o.full_row;
	})
	.map(({index}) => index);
    if(relevant_indexes.length > 0) return relevant_indexes;
}

function remove_full_rows(indexes) {
    console.log("indexes", indexes);

    world = world
    // remove full rows
	.map(arr => arr.filter((val, index) => !(indexes.some(i => i == index ))))
    // cons empty rows on top of the removed ones
	.map(arr => {
	    for (let i = 0; i < indexes.length; i++) {
		arr.unshift(WHITE);
	    }
	    return arr;
	});    
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

function merge_block_to_world() {
    let [block_x, block_y] = current_block.position;
    let w = block_width(current_block),
	h = block_height(current_block);
    for(let x = block_x; x < block_x + w; x++)
	for(let y = block_y; y < block_y + h; y++) {
	    let block_at = current_block.data[x - block_x][y - block_y]
	    if(block_at == WHITE) continue;
	    
	    world[x][y] = block_at;
	}
}


function update() {
    if(lost) return;
    
    let [ctx, canvas] = getCtx();
    let [_, y] = current_block.position;
    let [notinteresting, map_h] = max_dimensions(canvas);
    
    if (!collides_next_step(current_block)
	  &&
	(y + block_height(current_block) < map_h)) 
	current_block.position = vec_plus(current_block.position, [0, 1]);
    else {
	merge_block_to_world();

	let new_block = init_block();

	let [block_x, block_y] = new_block.position;
	for(let x = 0; x < new_block.data.length; x++)
	    for(let y= 0; y < new_block.data[x].length; y++) {
		if (world[block_x + x][block_y + y] == RED) {
		    alert('u ded!');
		    lost = true;
		}
	    }
	
	current_block = new_block
    }

    let full_rows = there_are_full_rows();

    if(full_rows) {
	remove_full_rows(full_rows);
    }
    
    draw();
}


document.addEventListener("DOMContentLoaded", e => {
    let [ctx, canvas] = getCtx();
    world = create_world(canvas);
    current_block.position[0] = Math.floor(canvas.width / grid_w / 2) - 2;
    draw();
    setInterval(update, 1000);
});

document.addEventListener('keyup', keyup);
