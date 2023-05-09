// function to display different conditions
function toggle_thin() {
  thin_checkbox = document.getElementById("thin_toggle");
  thin_shapes = document.getElementById("thin");
  if (thin_checkbox.checked) {
    thin_shapes.style.display = "block";
  } else {
    thin_shapes.style.display = "none";
  }
}

function toggle_thick() {
  thick_checkbox = document.getElementById("thick_toggle");
  thick_shapes = document.getElementById("thick");
  if (thick_checkbox.checked) {
    thick_shapes.style.display = "block";
  } else {
    thick_shapes.style.display = "none";
  }
}

function toggle_solid() {
  solid_checkbox = document.getElementById("solid");
  r1 = document.getElementById("rhom1");
  r4 = document.getElementById("rhom4");
  if (solid_checkbox.checked) {
    r1.style.display = "block";
    r4.style.display = "block";
  } else {
    r1.style.display = "none";
    r4.style.display = "none";
  }
}

function toggle_grad1() {
  grad1_checkbox = document.getElementById("grad1");
  r2 = document.getElementById("rhom2");
  r5 = document.getElementById("rhom5");
  if (grad1_checkbox.checked) {
    r2.style.display = "block";
    r5.style.display = "block";
  } else {
    r2.style.display = "none";
    r5.style.display = "none";
  }
}

function toggle_grad2() {
  grad2_checkbox = document.getElementById("grad2");
  r3 = document.getElementById("rhom3");
  r6 = document.getElementById("rhom6");
  if (grad2_checkbox.checked) {
    r3.style.display = "block";
    r6.style.display = "block";
  } else {
    r3.style.display = "none";
    r6.style.display = "none";
  }
}

// function to create hex black and white shade from num
function rgbToHex(c) {
  const hex = Number(c).toString(16);
  return `#${hex}${hex}${hex}`;
}

// code to change color of rhombussies
var slider = document.getElementById("myRange");
var output = document.getElementById("color_slider");
output.innerHTML = rgbToHex(slider.value);

slider.oninput = function() {
  output.innerHTML = rgbToHex(slider.value);
  var plain_rhoms = [];
  var grad_rhoms = [];
  var rev_grad_rhoms = [];
  // get the elements of all rhombus shapes
  for (let i = 1; i <= 6; i += 3) {
    // only uniformly set shade for left rhoms
    plain_rhoms.push(document.getElementById("rhom" + i))
  }
  // get elements for gradient rhoms
  for (let i = 2; i <= 6; i += 3) {
    // only uniformly set shade for left rhoms
    grad_rhoms.push(document.getElementById("rhom" + i))
  }
  // get elements for gradient rhoms
  for (let i = 3; i <= 6; i += 3) {
    // only uniformly set shade for left rhoms
    rev_grad_rhoms.push(document.getElementById("rhom" + i))
  }
  for (let i = 0; i < 2; i++) {
    color = rgbToHex(this.value);
    plain_rhoms[i].style.background = color;
    grad_rhoms[i].style.background = 'radial-gradient(' + color + ', white)'
    rev_grad_rhoms[i].style.background = 'radial-gradient(white, ' + color + ')'
  }
}


// code to move shape up and down
go_button = document.getElementById("move");
var start_move = false
var color = 'green';

go_button.onclick = function() {
  // change button color for fun
  if (color == 'red') {
    color = 'green';
    go_button.style.backgroundColor = '#4CAF50';
    go_button.innerHTML = 'GO'
  } else {
    color = 'red';
    go_button.style.backgroundColor = '#f44336';
    go_button.innerHTML = 'STOP'
  }

  var elems = [];
  // get the elements of all rhombus shapes
  for (let i = 1; i <= 6; i++) {
    elems.push(document.getElementById("rhom" + i))
  }

  var id = setInterval(frame, 80); // speed up or slow down
  var pos = 0, left = false;
  x_distance = 15 // how many pixels to cover left and right

  start_move = !start_move

  function frame() {

    if (start_move) {
      if (pos < x_distance && !left) {
        pos++;
        if (pos === x_distance) left = true;
        for (let i = 0; i < 6; i++) {
          elems[i].style.left = pos + 'px';
        }
      }
      else {
        pos--;
        if (pos <= 0) left = false;
        for (let i = 0; i < 6; i++) {
          elems[i].style.left = pos + 'px';
        }
      }
    } else {
      pos = 0, left = false;
      for (let i = 0; i < 6; i++) {
        elems[i].style.left = 0 + 'px';
      }
    }
  }
} 