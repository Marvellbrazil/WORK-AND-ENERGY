document.body.addEventListener('input', function (e) {
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
        let value = e.target.value;
        e.target.value = value.replace(/[^0-9]/, '');
    }
});

function linktblank(link){
    window.open(link);
}

function linktself(link){
    location.href = link;
}

// Variable Declarations :

// Mass section :
const density = document.getElementById('density'); //de
const volume = document.getElementById('volume'); //vo
const mass = document.getElementById('mass'); //ma


// Height section :
const maxHeight = document.getElementById('maxheight'); //mh
const distance = document.getElementById('distance'); //di
const height = document.getElementById('height'); //h


// Acceleration section :
const velocity = document.getElementById('velocity'); //ve
const time = document.getElementById('time'); //t
const acceleration = document.getElementById('acceleration'); //a

// energies section :
const potential = document.getElementById('potential'); //p
const kinetical = document.getElementById('kinetical'); //k
const mechanical = document.getElementById('mechanical'); //me

// Work section :
const force = document.getElementById('force'); //f
const work = document.getElementById('work'); //w

// Universal constant :
const g = 10;


// Main functions :

// function confirmationMessage(){
//     return "Do you want to leave this site?";
// }

function energies(){
    potential.value = formatNumberWithDots(mass.value * g * height.value);
    kinetical.value = formatNumberWithDots(0.5 * mass.value * Math.pow(velocity.value, 2));
    mechanical.value = formatNumberWithDots(Math.abs(potential.value) + Math.abs(kinetical.value));
}

function works(){
    force.value = formatNumberWithDots(mass.value * acceleration.value);
    work.value = formatNumberWithDots(force.value * distance.value);
}

function input(id){
    if(id == 'de' || id == 'vo'){
        const result = density.value * volume.value;
        mass.value = formatNumberWithDots(result);
        energies();
        works();
    } else if(id == 'ma'){
        density.value = '';
        volume.value = '';
        energies();
        works();
    } else if(id == 'mh'){
        const result = maxHeight.value - distance.value;
        height.value = formatNumberWithDots(result);
        energies();
        works();
    } else if(id == 'di'){
        const result = maxHeight.value - distance.value;
        height.value = formatNumberWithDots(result);
        energies();
        works();
    } else if(id == 'h'){
        maxHeight.value = '';
        distance.value = '';
        energies();
        works();
    } else if(id == 've' || id == 't'){
        const acc = velocity.value / time.value;
        acceleration.value = formatNumberWithDots(acc);
        energies();
        works();
    } else if(id == 'a'){
        velocity.value = '';
        time.value = '';
        energies();
        works();
    }
}

document.getElementById('mode').addEventListener('click', mode());

function mode(){
    document.getElementById('mode').style.transition = "0.5s";

    if(document.getElementById('mode').innerHTML == "Light"){
        document.getElementById('mode').innerHTML = "Dark";
        document.body.style.backgroundColor = "#121212";
        document.body.style.color = "#ffffff";
        document.querySelectorAll('.input').forEach(input => {
            input.style.backgroundColor = "#424242";
            input.style.color = "#ffffff";
        });
        document.querySelectorAll('.input').forEach(input => {
            input.style.borderColor = "#ffffff";
        });
    } else {
        document.getElementById('mode').innerHTML = "Light";
        document.body.style.backgroundColor = "#ffffff";
        document.body.style.color = "#000000";
        document.querySelectorAll('.input').forEach(input => {
            input.style.backgroundColor = "#ffffff";
            input.style.color = "#000000";
        });
        document.querySelectorAll('.input').forEach(input => {
            input.style.borderColor = "#000000";
        });
    }
    document.querySelectorAll('.input').forEach(input => {
        input.style.transition = "0.5s";
    });
}

//Number Formatting Function : 
function formatNumberWithDots(number) {
    if (typeof number === 'number') {
        let num = number.toLocaleString('en-US');
        num = num.replace(/,/g, '.');
        return num;
    }
    return number;
}